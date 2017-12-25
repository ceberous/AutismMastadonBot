const cheerio = require( "cheerio" );
const puppeteer = require( "puppeteer" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

var wResults = null;
var wFinalResults = [];

// https://github.com/GoogleChrome/puppeteer
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#
function PARSE_PUPPETEER(){
	return new Promise( function( resolve , reject ) {
		try {

			try { var $ = cheerio.load( wResults ); }
			catch(err) { reject( "cheerio load failed" ); return; }

			var wTitles = [];
			var wDOIS = [];

			$( "strong" ).each( function () {
				var wThis = $( this );
				var wID = wThis.text().trim();
				if ( wID === "dc:title" ) {
					var wTextNode = wThis.parent().siblings()[0];
					wTextNode = $( wTextNode ).text();
					wTitles.push( wTextNode );
				}
				else if ( wID === "prism:doi" ) {
					var wTextNode = wThis.parent().siblings()[0];
					wTextNode = $( wTextNode ).text();
					wDOIS.push( wTextNode );
				}
			});

			if ( wTitles.length === wDOIS.length ) {
				for ( var i = 0; i < wTitles.length; ++i ) {
					wFinalResults.push({
						doi: wDOIS[ i ] ,
						doiB64: EncodeB64( wDOIS[ i ] ) ,
						title: wTitles[ i ] ,
						mainURL:  DX_DOI_BASE_URL + "/" + wDOIS[ i ] ,
						scihubURL: SCI_HUB_BASE_URL + wDOIS[ i ]
					});
				}			
			}

			// Cleanup FinalResults for some reason
			var wL_Uneq = {};
			for ( var i = 0; i < wFinalResults.length; ++i ) {
				if ( !wL_Uneq[ wFinalResults[ i ][ "doiB64" ] ] ) {
					wL_Uneq[ wFinalResults[ i ][ "doiB64" ] ] = wFinalResults[ i ];
				}
			}
			wFinalResults = null;
			wFinalResults = [];
			for ( var item in wL_Uneq ) {
				wFinalResults.push({
					doi: wL_Uneq[ item ][ "doi" ] ,
					doiB64: item ,
					title: wL_Uneq[ item ][ "title" ] ,
					mainURL:  wL_Uneq[ item ][ "mainURL" ] ,
					scihubURL: wL_Uneq[ item ][ "scihubURL" ]
				});
			}

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

const wSearchURL_P1 = "https://www.nature.com/opensearch/request?interface=sru&query=dc.description+%3D+%22autism%22+OR+dc.subject+%3D+%22autism%22+OR+dc.title+%3D+%22autism%22+AND+prism.publicationDate+%3E+%22";
const wSearchURL_P2 = "%22&httpAccept=application%2Fsru%2Bxml&maximumRecords=100&startRecord=1&recordPacking=packed&sortKeys=publicationDate%2Cpam%2C0";
function FETCH_PUPPETEER(){
	return new Promise( async function( resolve , reject ) {
		try {
			
			// Javascript dates at their finest
			// I'm sorry... there is a better way I'm sure. but I am too dumb
			var today = new Date();
			today.setDate( today.getDate() - 30 ); // Search Previous 30 Days
			var wTY = today.getFullYear().toString();
			var wTM = ( today.getMonth() + 1 );
			if ( wTM < 10 ) { wTM = "0" + wTM.toString(); }
			else{ wTM = wTM.toString(); }
			var wTD = today.getDate();
			if ( wTD < 10 ) { wTD = "0" + wTD.toString(); }
			else{ wTD = wTD.toString(); }
			const wFinalDateString = wTY + "-" + wTM + "-" + wTD;
			const wFinalURL = wSearchURL_P1 + wFinalDateString + wSearchURL_P2;
			console.log( wFinalURL );

			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto( wFinalURL , { waitUntil: "networkidle2" });
			wResults = await page.content();
			await browser.close();
			await PARSE_PUPPETEER();

			resolve();

		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function SEARCH_TODAY( wOptions ) {
	return new Promise( async function( resolve , reject ) {
		try {
			
			console.log( "" );
			console.log( "\nNature.com Scan Started" );
			PrintNowTime();

			// 1.) Fetch New Search Results
			await FETCH_PUPPETEER();
			console.log( wFinalResults );

			// 2.) Filter
			wFinalResults = await FilterUNEQResultsREDIS( wFinalResults );

			// 3.) Post Uneq
			await PostResults( wFinalResults );
			
			console.log( "\nNature.com Scan Finished" );
			console.log( "" );
			PrintNowTime();

			wResults = null;
			wFinalResults = null;
			wFinalResults = [];
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH_TODAY;