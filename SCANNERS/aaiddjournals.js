require("shelljs/global");
const puppeteer = require( "puppeteer" );
const cheerio = require( "cheerio" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

const AAIDD_JOURNALS_BASE_MAIN_URL = "http://www.aaiddjournals.org/doi/";
const AAIDD_JOURNALS_BASE_PAPER_URL = "http://www.aaiddjournals.org/doi/pdf/";

function PARSE_RESULTS( wBody ) {
	
	try { var $ = cheerio.load( wBody ); }
	catch( err ) { return( "cheerio load failed" ); }

	var finalResults = [];
	$( ".articleEntry" ).each( function() {

		var wTitle = $( this ).find( ".art_title" );
		if ( !wTitle ) { return false; }
		wTitle = $( wTitle ).text();
		if ( !wTitle ) { return false; }
		wTitle = wTitle.trim();
		
		var wDOI = $( this ).find( "input" );
		if ( !wDOI ) { return false; }
		wDOI = $( wDOI ).attr( "value" );

		finalResults.push({
			title: wTitle ,
			doi: wDOI ,
			doiB64: EncodeB64( wDOI ) ,
			mainURL:  DX_DOI_BASE_URL + "/" + wDOI ,
			scihubURL: SCI_HUB_BASE_URL + wDOI
		});

	});

	return finalResults;
}

const AAIDD_JOURNALS_BASE_URL = "http://www.aaiddjournals.org/action/doSearch?startPage=0&pageSize=100";
const AAIDD_JOURNALS_URL_P1 = "&Keyword=autism&target=default";
const AAIDD_JOURNALS_URL_P2 = "&Keyword=autism&target=default&sortBy=Ppub";
function generateSearchURL() {
	
	var previous = new Date();
	previous.setDate( previous.getDate() - 30 );
	const wPY = previous.getFullYear().toString();
	const wPM = ( previous.getMonth() + 1 );
	
	var future = new Date();
	future.setDate( future.getDate() + 30 );
	const wFY = future.getFullYear().toString();
	const wFM = ( future.getMonth() + 1 );

	const wTimeSelection = "&AfterMonth=" + wPM + "&AfterYear=" + wPY + "&BeforeMonth=" + wFM + "&BeforeYear=" + wFY;
	return AAIDD_JOURNALS_BASE_URL + wTimeSelection + AAIDD_JOURNALS_URL_P1 + wTimeSelection + AAIDD_JOURNALS_URL_P2;
}

function SEARCH( wJournals ) {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "" );
			console.log( "AAIDD_Journals.org Scan Started" );
			PrintNowTime();	
			
			// 1.) Get This Month's Raw Results
			var wSearchURL = generateSearchURL();
			console.log( wSearchURL );
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto( wSearchURL , { waitUntil: "networkidle2" });
			var wResults = await page.content();
			await browser.close();
			wResults = PARSE_RESULTS( wResults );

			// 2.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 4.) Post Results
			await PostResults( wResults );

			exec( "pkill -9 chrome" , { silent: true ,  async: false } );

			console.log( "" );
			console.log( "AAIDD_Journals.org Scan Finished" );
			PrintNowTime();			
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;