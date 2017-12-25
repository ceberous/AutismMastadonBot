const cheerio = require( "cheerio" );
const { map } = require( "p-iteration" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FetchXMLFeed = require( "../UTILS/genericUtils.js" ).fetchXMLFeed;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;
const KARGER_RSS_URLS = require( "../CONSTANTS/karger.js" ).URLS;

const SPEC_SEARCH_TERMS = [ "autism" , "autistic" , "ASD" ];
function scanText( wText ) {
	
	for ( var i = 0; i < SPEC_SEARCH_TERMS.length; ++i ) {
		var wSTResult = wText.indexOf( SPEC_SEARCH_TERMS[ i ] );
		if ( wSTResult !== -1 ) {
			return true;
		}
	}
	
	return false;
}

function PARSE_XML_RESULTS( wResults ) {
	var finalResults = [];
	for ( var i = 0; i < wResults.length; ++i ) {

		var wTitle = wResults[ i ][ "title" ];
		if ( wTitle ) { wTitle = wTitle.trim(); }
		var wFoundInTitle = scanText( wTitle );
		var wDescription = wResults[ i ][ "rss:description" ][ "#" ];
		if ( wDescription ) { wDescription = wDescription.trim(); }
		var wFoundInDescription = scanText( wDescription );

		if ( wFoundInTitle || wFoundInDescription ) {
			var wMainURL = wResults[ i ][ "link" ];
			finalResults.push({
				title: wTitle ,
				mainURL: wMainURL ,
			});
		}

	}
	return finalResults;
}


function SEARCH_SINGLE_KARGER_ARTICLE( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {
			
			var wBody = await MakeRequest( wURL );
			try { var $ = cheerio.load( wBody ); }
			catch( err ) { resolve( "fail" ); return; }

			var wDOI = $( ".articleDetails" ).children();
			wDOI = $( wDOI[1] ).children();
			wDOI = $( wDOI[0] ).children( "a" );
			wDOI = $( wDOI[0] ).attr( "href" );
			wDOI = wDOI.split( "https://doi.org/" )[1];
			resolve( wDOI );
		}
		catch( error ) { console.log( error ); resolve( "fail" ); }
	});
}

function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "\nKarger.com Scan Started" );
			console.log( "" );
			PrintNowTime();			

			// 1. ) Fetch Latest RSS-Results Matching "autism-keywords"
			var wResults = await map( KARGER_RSS_URLS , wURL => FetchXMLFeed( wURL ) );
			wResults = wResults.map( x => PARSE_XML_RESULTS( x ) );
			wResults = [].concat.apply( [] , wResults );
			//console.log( wResults );

			// 2.) Gather 'Meta' info for each Matched Item
			var wMetaURLS = wResults.map( x => x[ "mainURL" ] );
			wMetaURLS = await map( wMetaURLS , wURL => SEARCH_SINGLE_KARGER_ARTICLE( wURL ) );
			for ( var i = 0; i < wResults.length; ++i ) {
				wResults[ i ][ "doi" ] = wMetaURLS[ i ];
				wResults[ i ][ "doiB64" ] = EncodeB64( wMetaURLS[ i ] );
				if ( wMetaURLS[ i ] !== "fail" ) {
					wResults[ i ][ "scihubURL" ] = SCI_HUB_BASE_URL + wMetaURLS[ i ];
				}
			}

			// 3.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 4.) Post Results
			await PostResults( wResults );

			console.log( "\nKarger.com Scan Finished" );
			console.log( "" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;