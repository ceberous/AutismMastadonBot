const cheerio = require( "cheerio" );
const puppeteer = require( "puppeteer" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;


const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

const OUP_SEARCH_URL_P1 = "https://academic.oup.com/journals/search-results?f_ContentType=Journal+Article&fl_ArticleTitleExact=autism&fl_SiteID=5567&qb=%7b%22ArticleTitle1%22%3a%22autism%22%2c%22ArticleAbstract2%22%3a%22autism%22%7d&sort=Date+%e2%80%93+Newest+First&rg_ArticleDate=";
const OUP_SEARCH_URL_P2 = "%20TO%20";

function genTodaySearchURL(){

	var today = new Date();
	var wTY = today.getFullYear();
	var wTM = ( today.getMonth() + 1 );
	var wTD = today.getDate();
	var todayDateString = wTM + "/" + wTD + "/" + wTY;

	var previous = new Date( new Date().setDate( new Date().getDate() - 30 ) );
	var wPY = previous.getFullYear();
	var wPM = ( previous.getMonth() + 1 );
	var wPD = previous.getDate();
	var previousDateString = wPM + "/" + wPD + "/" + wPY;
	
	return OUP_SEARCH_URL_P1 + previousDateString + OUP_SEARCH_URL_P2 + todayDateString;
}


function PARSE_RESULT_PAGE( wBody ) {
	return new Promise( function( resolve , reject ) {
		try {

			try { var $ = cheerio.load( wBody ); }
			catch(err) { reject( "cheerio load failed" ); return; }

			var finalResults = [];
			$( ".al-article-box" ).each( function() {
				
				var wTitle = $( this ).children( ".customLink" );
				wTitle = $( wTitle ).children( "a" );
				wTitle = $( wTitle[0] ).text();
				if ( wTitle ) { wTitle = wTitle.trim(); }

				var wMainURL = $( this ).children( ".al-citation-list" ).children( "span" ).children( "a" );
				wMainURL = $( wMainURL[0] ).attr( "href" );

				var wDOI = wMainURL.split( "https://doi.org/" )[1];

				finalResults.push({
					doi: wDOI ,
					doiB64: EncodeB64( wDOI ) ,
					title: wTitle ,
					mainURL:  wMainURL ,
					scihubURL: SCI_HUB_BASE_URL + wDOI					
				});

			});

			resolve( finalResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}


function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "\nAcademic.OUP.com Scan Started" );
			console.log( "" );
			PrintNowTime();			

			// 1. ) Fetch Latest Results
			var wURL = genTodaySearchURL();
			console.log( wURL );
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto( wURL , { waitUntil: "networkidle2" });
			var wResults = await page.content();
			await browser.close();
			var finalResults = await PARSE_RESULT_PAGE( wResults );
			console.log( finalResults );

			// 2.) Compare to Already 'Tracked' DOIs and Store Uneq
			finalResults = await FilterUNEQResultsREDIS( finalResults );
			
			// 3.) Post Results
			await PostResults( finalResults );

			console.log( "\nAcademic.OUP.com Scan Finished" );
			console.log( "" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;