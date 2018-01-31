require("shelljs/global");
const puppeteer = require( "puppeteer" );
const cheerio = require( "cheerio" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;
const MONTH_ABREVIATIONS = require( "../CONSTANTS/generic.js" ).MONTH_ABREVIATIONS;


function PARSE_RESULTS( xBody ) {
	return new Promise( function( resolve , reject ) {
		try {

			try { var $ = cheerio.load( xBody ); }
			catch( err ) { console.log( err ); resolve( [] ); return; }

			console.log( "here" );
			var wResultList = $( ".highwire-search-results-list" );
			if ( !wResultList ) { console.log( "No Results" ); resolve( [] ); return; }
			wResultList = $( wResultList ).children();
			if ( !wResultList ) { console.log( "No Results" ); resolve( [] ); return; }
			console.log( "there" );

			var finalResults = [];
			$( wResultList ).each( function() {
				
				var wTitle = $( this ).find( "span[class='highwire-cite-title']" );
				if ( !wTitle ) { return false; }
				wTitle = $( wTitle ).text();
				if ( !wTitle ) { return false; }

				var wDOI = $( this ).find( "span[class='highwire-cite-metadata-doi highwire-cite-metadata']" );
				if ( !wDOI ) { return false; }
				wDOI = $( wDOI ).children();
				if ( !wDOI ) { return false; }
				wDOI = $( wDOI[0] ).attr( "href" );
				if ( !wDOI ) { return false; }
				if ( wDOI.indexOf( "doi.org" ) === -1 ) { return false; }
				wDOI = wDOI.split( "doi.org/" )[1];

				finalResults.push({
					title: wTitle , 
					doi: wDOI ,
					doiB64: EncodeB64( wDOI ) ,
					mainURL: DX_DOI_BASE_URL + "/" + wDOI ,
					scihubURL: SCI_HUB_BASE_URL + wDOI
				});

			});

			resolve( finalResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}


// const PNAS_URL_BASE = "http://www.pnas.org/search?tmonth=";
// const PNAS_URL_P1 = "&pubdate_year=&submit=yes&submit=yes&submit=Submit&andorexacttitle=and&format=standard&firstpage=&fmonth=";
// const PNAS_URL_P2 = "&title=&tyear=";
// const PNAS_URL_P3 = "&hits=200&titleabstract=autism&volume=&sortspec=date&andorexacttitleabs=or&author2=&tocsectionid=all&andorexactfulltext=and&author1=&fyear=";
// const PNAS_URL_P4 = "&doi=&fulltext=";

const PNAS_NEW_URL_P1 = "http://www.pnas.org/search/abstract_title%3Aautism%2B%20abstract_title_flags%3Amatch-any%20limit_from%3A2017-12-01%20limit_to%3A2018-12-31%20numresults%3A100%20sort%3Apublication-date%20direction%3Adescending%20format_result%3Astandard";
function generateSearchURL() {

	const wNow = new Date();
	//wNow.setDate( wNow.getDate() + ( 30 * 11 ) );
	const wTY = wNow.getFullYear();
	const wTM = parseInt( wNow.getMonth() + 1 );

	var nextMonth_ABR = null;
	if ( wTM === 12 ) {
		nextMonth_ABR = MONTH_ABREVIATIONS[ wTM - 1 ];
	}
	else {
		nextMonth_ABR = MONTH_ABREVIATIONS[ wTM ];
	}
	
	var previous = wNow;
	previous.setDate( previous.getDate() - 30 ); // Search Previous 30 Days
	const prevYear = previous.getFullYear();
	const prevMonth = parseInt( previous.getMonth() + 1 );
	const prevMonth_ABR = MONTH_ABREVIATIONS[ prevMonth - 1 ];

	return PNAS_URL_BASE + nextMonth_ABR + PNAS_URL_P1 + prevMonth_ABR + PNAS_URL_P2 + wTY
				+  PNAS_URL_P3 + prevYear + PNAS_URL_P4;
}

function SEARCH( wOptions ) {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "" );
			console.log( "Pnas.org Scan Started" );
			PrintNowTime();
			
			// 1.) Search for Results
			//const S_URL = generateSearchURL();
			console.log( PNAS_NEW_URL_P1 );
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto( PNAS_NEW_URL_P1 , { timeout: ( 150 * 1000 ) , waitUntil: "networkidle2" });
			var wBody = await page.content();
			await browser.close();
			var wResults = await PARSE_RESULTS( wBody );
			console.log( wResults );

			// 2.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 3.) Post Uneq Results
			await PostResults( wResults );
			
			exec( "pkill -9 chrome" , { silent: true ,  async: false } );
			
			console.log( "" );
			console.log( "\Pnas.org Scan Finished" );
			PrintNowTime();
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;