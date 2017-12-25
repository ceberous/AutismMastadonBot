const cheerio = require( "cheerio" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

const JMIR_SEARCH_URL_P1 = "http://www.jmir.org/search/searchResult?field%5B%5D=date-accepted&criteria%5B%5D=1&startDate%5B%5D=";
const JMIR_SEARCH_URL_P2 = "&endDate%5B%5D=";
const JMIR_SEARCH_URL_P3 = "&operator%5B%5D=AND&field%5B%5D=title&criteria%5B%5D=autism&operator%5B%5D=OR&field%5B%5D=abstract&criteria%5B%5D=autism";

const JMIR_JSON_URL_P1 = "http://www.jmir.org/zzz/query?field%5B%5D=date-accepted&criteria%5B%5D=1&startDate%5B%5D=";
const JMIR_JSON_URL_P2 = "&endDate%5B%5D=";
const JMIR_JSON_URL_P3 = "&operator%5B%5D=AND&field%5B%5D=title&criteria%5B%5D=autism&operator%5B%5D=OR&field%5B%5D=abstract&criteria%5B%5D=autism&page=1&sort=&filter=All%20Journals";

function GET_TIME_NOW_URL() {

	var today = new Date();
	var wTY = today.getFullYear();
	var wTM = ( today.getMonth() + 1 );
	var wTD = today.getDate();
	var wEndDate = wTY + "-" + wTM + "-" + wTD;

	// var previous = new Date( new Date().setDate( new Date().getDate() - 30 ) );
	var previous = new Date( new Date().setDate( new Date().getDate() - 244 ) );
	var wPY = previous.getFullYear();
	var wPM = ( previous.getMonth() + 1 );
	var wPD = previous.getDate();
	var wStartDate = wPY + "-" + wPM + "-" + wPD;

	//return JMIR_SEARCH_URL_P1 + wStartDate + JMIR_SEARCH_URL_P2 + wEndDate + JMIR_SEARCH_URL_P3; 
	return JMIR_JSON_URL_P1 + wStartDate + JMIR_JSON_URL_P2 + wEndDate + JMIR_JSON_URL_P3;

}

function PARSE_JSON_RESULTS( wBody ) {
	var finalResults = [];
	if ( wBody[ "docs" ] ) {
		for ( var i = 0; i < wBody[ "docs" ].length; ++i ) {
			finalResults.push({
				title: wBody[ "docs" ][ i ][ "title" ] ,
				doi: wBody[ "docs" ][ i ][ "doi" ] ,
				doiB64: EncodeB64( wBody[ "docs" ][ i ][ "doi" ] ) ,
				mainURL: wBody[ "docs" ][ i ][ "url" ] ,
				scihubURL: wBody[ "docs" ][ i ][ "pdfUrl" ] ,
			});
		}
	}
	return finalResults;
}

function PARSE_HTML_RESULTS( wBody ) {
	return new Promise( function( resolve , reject ) {
		try {

			try { var $ = cheerio.load( wBody ); }
			catch(err) { reject( "cheerio load failed" ); return; }
			console.log( $( "body" ).html() );

			var finalResults = [];
			// $( "article" ).each( function() {
			// 	var wTitle = 
			// });

			// $( "div[data-doi]" )

			resolve( finalResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}


function SEARCH( wOptions ) {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "" );
			console.log( "\nJMIR.org Scan Started" );
			PrintNowTime();
			
			// 1.) Get Results
			var wSearchURL = GET_TIME_NOW_URL();
			var wResults = await MakeRequest( wSearchURL );
			try { 
				wResults = JSON.parse( wResults ); 
				if ( wResults[ "response" ] ) { wResults = PARSE_JSON_RESULTS( wResults[ "response" ] ); }
			}
			catch( e ) { wResults = await PARSE_RESULTS( wResults ); }
			console.log( wResults );

			// 2.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 3.) Post Uneq Results
			await PostResults( wResults );
			
			console.log( "" );
			console.log( "\nJMIR.org Scan Finished" );
			PrintNowTime();
			resolve();

		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;