const { map } = require( "p-iteration" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FetchXMLFeed = require( "../UTILS/genericUtils.js" ).fetchXMLFeed;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;
const FRONTIERSIN_URLS = require( "../CONSTANTS/frontiersin.js" ).URLS;


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
			var wDOI = wMainURL.split( "https://www.frontiersin.org/articles/" )[1];
			finalResults.push({
				title: wTitle ,
				doi: wDOI ,
				doiB64: EncodeB64( wDOI ) ,
				mainURL: wMainURL ,
				scihubURL: wMainURL + "/pdf"
			});
		}

	}
	return finalResults;
}

function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "\nFrontiersin.org Scan Started" );
			console.log( "" );
			PrintNowTime();			

			// 1. ) Fetch Latest RSS-Results Matching "autism-keywords"
			var wResults = await map( FRONTIERSIN_URLS , wURL => FetchXMLFeed( wURL ) );
			wResults = wResults.map( x => PARSE_XML_RESULTS( x ) );
			wResults = [].concat.apply( [] , wResults );
			console.log( wResults );

			// 3.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 4.) Post Results
			await PostResults( wResults );

			console.log( "\nFrontiersin.org Scan Finished" );
			console.log( "" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;