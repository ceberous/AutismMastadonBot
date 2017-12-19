const request = require( "request" );
const cheerio = require( "cheerio" );
const { map } = require( "p-iteration" );
const resolver = require("resolver");

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

function wSleep( ms ) { return new Promise( resolve => setTimeout( resolve , ms ) ); }

const DX_DOI_BASE_URL = "http://dx.doi.org";
const SCI_HUB_BASE_URL = DX_DOI_BASE_URL + ".sci-hub.tw/";

function RESOLVE_SHORT_LINK( wURL ) {
	return new Promise( function( resolve , reject ) {
		try {
			resolver.resolve( wURL , function( err , url , filename , contentType ) {
				resolve( url );
			});
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}


function PARSE_INDIVIDUAL_PAGE( wResults ) {
	return new Promise( function( resolve , reject ) {
		try {

			try { var $ = cheerio.load( wResults ); }
			catch(err) { resolve( "cheerio load failed" ); return; }


			var wDOI_Pass1 = $( ".doi" ).html();
			if ( wDOI_Pass1 === null ) {
				var wDOI = $( ".DoiLink" ).children();
				var x_DOI = $( wDOI[0] ).html();
				if ( x_DOI === null ) { 
					console.log( "last try" );
					var x1_DOI = $( ".S_C_ddDoi" ).html();
					console.log( x1_DOI );
					if ( x1_DOI === null ) { resolve( "error" ); return; }
					else {
						x1_DOI = x1_DOI.trim();
						resolve( x1_DOI );
						return;
					}
				}
				else {
					x_DOI = x_DOI.trim();
					resolve( x_DOI );
					return;
				}
			}
			else {
				wDOI_Pass1 = wDOI_Pass1.trim();
				resolve( wDOI_Pass1 );
				return;
			}

		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function SEARCH_INDIVIDUAL_PAGE( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {
			
			request( wURL , async function ( err , response , body ) {
				console.log( wURL + "\n\t--> RESPONSE_CODE = " + response.statusCode.toString() );
				if ( response.statusCode !== 200 ) {
					console.log( "bad status code ... no retry implemntation yet..." );
					resolve( "request error" );
					return;
				}
				else {
					var wResults = await PARSE_INDIVIDUAL_PAGE( body );
					resolve( wResults );
				}
			});
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function PARSE_MAIN_RESULTS( wResults ) {
	return new Promise( async function( resolve , reject ) {
		try {
			try { var $ = cheerio.load( wResults ); }
			catch(err) { resolve( "cheerio load failed" ); return; }
			
			var finalResults = [];
			var wTitles = [];
			var wLinks = [];

			// 1.) Parse Raw HTML
			$( "item" ).each( function() {
				var wChildren = $( this ).children();
				var wTitle = $( wChildren[0] ).text();
				var wLink = $( this ).text();
				var wStart = wLink.indexOf( "http://" );
				wLink = wLink.substring( wStart , wLink.length );
				wLink = wLink.split( " " )[0];
				wTitles.push( wTitle );
				wLinks.push( wLink );
			});

			// 2.) Resolve Burried Links
			//wLinks = await map( wLinks , wURL => RESOLVE_SHORT_LINK( wURL ) );

			await wSleep( 1000 );

			// 3.) Search Each Result-Page for DOI
			var wDOIS = await map( wLinks , wURL => SEARCH_INDIVIDUAL_PAGE( wURL ) );

			for ( var i = 0; i < wTitles.length; ++i ) {
				var wDOI_ID_Only = wDOIS[ i ].split( "https://doi.org/" )[1];
				if ( wDOI_ID_Only === undefined ) {
					console.log( "this caused a problem ???" );
					console.log( wDOIS[ i ] );
					continue;
				}
				finalResults.push({
					title: wTitles[ i ] ,
					mainURL: wDOIS[ i ] ,
					scihubURL: SCI_HUB_BASE_URL + wDOI_ID_Only ,
					doi: wDOI_ID_Only ,
					doiB64: EncodeB64( wDOI_ID_Only ) ,
				});
			}

			console.log( finalResults );
			resolve( finalResults );

		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}


const SEARCH_CUSTOM_RSS_FEED_URL = "https://rss.sciencedirect.com/getMessage?registrationId=JCGCKFOCKEGLNCIJLCHJKEHCKLKJKDJIMKLEJLIILR";
function SEARCH_TODAY( wOptions ) {
	return new Promise( function( resolve , reject ) {
		try {
			console.log( SEARCH_CUSTOM_RSS_FEED_URL );
			request( SEARCH_CUSTOM_RSS_FEED_URL , async function ( err , response , body ) {
				console.log( "\t--> RESPONSE_CODE = " + response.statusCode.toString() );
				if ( response.statusCode !== 200 ) {
					console.log( "bad status code ... no retry implemntation yet..." );
					resolve( "request error" );
					return;
				}
				else {
					var wResults = await PARSE_MAIN_RESULTS( body );
					wResults = await FilterUNEQResultsREDIS( wResults );
					await PostResults( wResults );
					resolve( wResults );
				}
			});
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH_TODAY;