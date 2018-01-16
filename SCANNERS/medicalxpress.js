require("shelljs/global");
const puppeteer = require( "puppeteer" );
const cheerio = require( "cheerio" );

const redis = require( "../UTILS/redisManager.js" ).redisClient;
const RU = require( "../UTILS/redisUtils.js" );
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

const R_MEDICAL_EXPRESS_ARTICLES = "SCANNERS_MEDICAL_EXPRESS.ALREADY_TRACKED";
function FILTER_ALREADY_TRACKED_MED_EXPRESS_ARTICLES( wResults ) {
	return new Promise( async function( resolve , reject ) {
		try {
			var wArticleIDS = wResults.map( x => EncodeB64( x[ "mainURL" ] ) );
			//console.log( wArticleIDS );

			// 1.) Generate Random-Temp Key
			var wTempKey = Math.random().toString(36).substring(7);
			var R_PLACEHOLDER = "SCANNERS." + wTempKey + ".PLACEHOLDER";
			var R_NEW_TRACKING = "SCANNERS." + wTempKey + ".NEW_TRACKING";

			await RU.setSetFromArray( redis , R_PLACEHOLDER , wArticleIDS );
			await RU.setDifferenceStore( redis , R_NEW_TRACKING , R_PLACEHOLDER , R_MEDICAL_EXPRESS_ARTICLES );
			await RU.delKey( redis , R_PLACEHOLDER );
			await RU.setSetFromArray( redis , R_MEDICAL_EXPRESS_ARTICLES , wArticleIDS );

			const wNewTracking = await RU.getFullSet( redis , R_NEW_TRACKING );
			if ( !wNewTracking ) { 
				await RU.delKey( redis , R_NEW_TRACKING ); 
				console.log( "nothing new found" ); 
				PrintNowTime(); 
				resolve( [] );
				return;
			}
			if ( wNewTracking.length < 1 ) {
				await RU.delKey( redis , R_NEW_TRACKING );
				console.log( "nothing new found" ); 
				PrintNowTime();
				resolve( [] );
				return;
			}
			wResults = wResults.filter( x => wNewTracking.indexOf( EncodeB64( x[ "mainURL" ] ) ) !== -1 );
			await RU.delKey( redis , R_NEW_TRACKING );
			resolve( wResults );
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

			// 3.) Filter Already "Searched" Medical Express Articles
			wResults = await FILTER_ALREADY_TRACKED_MED_EXPRESS_ARTICLES( wResults );

			// 4.) Gather Meta Data from Each MedicalXPress Article Page
			var wMainURLS = wResults.map( x => x[ "mainURL" ] )
			var wMetaDetails = [];
			for ( var i = 0; i < wResults.length; ++i ) {
				var wDOI = await SEARCH_INDIVIDUAL_PAGE_FOR_META_DATA( wResults[ i ][ "mainURL" ] );
				wMetaDetails.push( wDOI );
			}
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

			// 5.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 6.) Post Results
			await PostResults( wResults );

			exec( "pkill -9 chrome" , { silent: true ,  async: false } );
			console.log( "\nMedicalXPress.com Scan Finished" );
			console.log( "" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;