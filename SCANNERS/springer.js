const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FetchXMLFeed = require( "../UTILS/genericUtils.js" ).fetchXMLFeed;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;


const Advanced_Search_1 = "https://link.springer.com/search?date-facet-mode=between&facet-start-year=2018&sortOrder=newestFirst&facet-end-year=2018&query=%28autism+OR+autistic+OR+Autism+OR+Autistic+OR+ASD%29&showAll=true";
const Advanced_Search_1_RSS = "https://link.springer.com/search.rss?date-facet-mode=between&facet-start-year=2018&sortOrder=newestFirst&facet-end-year=2018&query=%28autism+OR+autistic+OR+Autism+OR+Autistic+OR+ASD%29&showAll=true";

const Advanced_Search_1_CSV = "https://link.springer.com/search/csv?date-facet-mode=between&facet-start-year=2018&sortOrder=newestFirst&facet-end-year=2018&query=(autism+OR+autistic+OR+Autism+OR+Autistic+OR+ASD)&showAll=true";

const SPRINGER_SEARCH_URL_P1 = "https://link.springer.com/search.rss?date-facet-mode=between&sortOrder=newestFirst&facet-end-year="
const SPRINGER_SEARCH_URL_P2 = "&facet-start-year=";
const SPRINGER_SEARCH_URL_P3 = "&query=autism&dc.title=autism&showAll=true&facet-content-type=%22Article%22";

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

const SPEC_SEARCH_TERMS = [ "autism" , "autistic" , "ASD" ];
function scanText( wText ) {
	if ( !wText ) { return false; }
	for ( var i = 0; i < SPEC_SEARCH_TERMS.length; ++i ) {
		var wSTResult = wText.indexOf( SPEC_SEARCH_TERMS[ i ] );
		if ( wSTResult !== -1 ) {
			return true;
		}
	}
	
	return false;
}

function PARSE_XML_RESULTS( wResults ) {
	return new Promise( function( resolve , reject ) {
		try {

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
					var wDOI = wMainURL.split( "http://link.springer.com/" )[1];
					finalResults.push({
						title: wTitle ,
						doi: wDOI ,
						doiB64: EncodeB64( wDOI ) ,
						mainURL: wMainURL ,
						scihubURL: SCI_HUB_BASE_URL + wDOI
					});
				}

			}

			resolve( finalResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function GENERATE_NOW_URL() {
	var today = new Date();
	var wTY = today.getFullYear();
	return SPRINGER_SEARCH_URL_P1 + wTY + SPRINGER_SEARCH_URL_P2 + wTY + SPRINGER_SEARCH_URL_P3;
}

function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "\nSpringer.com Scan Started" );
			console.log( "" );
			PrintNowTime();			

			// 1. ) Fetch Latest Results
			var wURL = GENERATE_NOW_URL();
			var wResults = await FetchXMLFeed( wURL );
			wResults = await PARSE_XML_RESULTS( wResults );

			// 2.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 3.) Post Results
			await PostResults( wResults );

			console.log( "\nSpringer.com Scan Finished" );
			console.log( "" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;