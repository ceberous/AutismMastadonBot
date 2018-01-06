const puppeteer = require( "puppeteer" );
const cheerio = require( "cheerio" );
const { map } = require( "p-iteration" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

function FETCH_WITH_PUPPETEER( wURL ) {
	// https://github.com/GoogleChrome/puppeteer/issues/822
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "Searching --> " + wURL );
			const browser = await puppeteer.launch( { args: [ "--disable-http2" ] } );
			const page = await browser.newPage();
			await page.goto( wURL , { waitUntil: "networkidle2" });
			var wBody = await page.content();
			await browser.close();	
			resolve( wBody );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function SEARCH_INDIVIDUAL_PAGE_FOR_META_DATA( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {
			var wBody = await FETCH_WITH_PUPPETEER( wURL );
			try { var $ = cheerio.load( wBody ); }
			catch( err ) { return "fail"; }
			var wDOI_Link = undefined;
			var wNewsSection = $( ".news-relevant" );
			if ( wNewsSection ) {
				wDOI_Link = $( wNewsSection ).next( "p" );
				if ( wDOI_Link ) {
					wDOI_Link = $( wDOI_Link ).find( "a" );
					if ( wDOI_Link ) { wDOI_Link = $( wDOI_Link[ 0 ] ).attr( "href" ); }
				}
			}
			resolve( wDOI_Link );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function PARSE_SEARCH_PAGE( wBody ) {
	try { var $ = cheerio.load( wBody ); }
	catch( err ) { return "fail"; }
	var finalResults = [];
	$( "article" ).each( function() {
		var wContainer = $( this ).find( ".news-box-text" );
		if ( wContainer ) {
			wContainer = $( wContainer[ 0 ] ).children();
			var wTitle = $( wContainer[ 0 ] ).text();
			if ( !wTitle ) { return false; }
			wTitle = wTitle.trim();
			var wMainURL = $( wContainer[ 0 ] ).children();
			if ( !wMainURL ) { return false; }
			wMainURL = $( wMainURL[ 0 ] ).attr( "href" );
			finalResults.push({
				title: wTitle , 
				mainURL: wMainURL
			});
		}
	});
	return finalResults;
}

const MEDICAL_XPRESS_SEARCH_URL = "https://medicalxpress.com/search/sort/date/all/?search=autism";
function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "\nMedicalXPress.com Scan Started" );
			console.log( "" );
			PrintNowTime();			

			// 1. ) Fetch Search Results
			var wBody = await FETCH_WITH_PUPPETEER( MEDICAL_XPRESS_SEARCH_URL );

			// 2. ) Parse Search Results
			var wResults = PARSE_SEARCH_PAGE( wBody );

			// 3.) Gather Meta Data from Each MedicalXPress Article Page
			var wMainURLS = wResults.map( x => x[ "mainURL" ] )
			var wMetaDetails = await map( wMainURLS , wURL => SEARCH_INDIVIDUAL_PAGE_FOR_META_DATA( wURL ) );
			for ( var i = 0; i < wMetaDetails.length; ++i ) {
				var wDOI = undefined;
				if ( wMetaDetails[ i ] !== undefined ) {
					if ( wMetaDetails[ i ].indexOf( "dx.doi.org" ) !== -1 ) {
						wDOI = wMetaDetails[ i ].split( "dx.doi.org/" )[ 1 ];
						wResults[ i ][ "doi" ] = wDOI;
						wResults[ i ][ "doiB64" ] = EncodeB64( wDOI );
						wResults[ i ][ "scihubURL" ] = SCI_HUB_BASE_URL + wDOI;						
					}
					else if ( wMetaDetails[ i ].indexOf( "doi/full/" ) !== -1 ) {
						wDOI = wMetaDetails[ i ].split( "doi/full/" )[ 1 ];
						wResults[ i ][ "doi" ] = wDOI;
						wResults[ i ][ "doiB64" ] = EncodeB64( wDOI );
						wResults[ i ][ "scihubURL" ] = SCI_HUB_BASE_URL + wDOI;						
					}
					else {
						if ( wMetaDetails[ i ].indexOf( "jamanetwork" ) !== -1 ) { continue; }
						// Push these 'others' into #AutismResearch ?
						wDOI = wMetaDetails[ i ];
						wResults[ i ][ "doi" ] = wDOI;
						wResults[ i ][ "doiB64" ] = EncodeB64( wDOI );
						wResults[ i ][ "scihubURL" ] = wDOI;
					}
				}
				else {
					wDOI = wResults[ i ][ "mainURL" ];
					wResults[ i ][ "doi" ] = wDOI;
					wResults[ i ][ "doiB64" ] = EncodeB64( wDOI );
				}
			}
			wResults = wResults.filter( x => x[ "doi" ] !== undefined );

			// 3.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 4.) Post Results
			await PostResults( wResults );

			console.log( "\nMedicalXPress.com Scan Finished" );
			console.log( "" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;