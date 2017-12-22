const PostResults = require( "../UTILS/mastadonManager.js" ).emumerateStatusPosts;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const FetchXMLFeed = require( "../UTILS/genericUtils.js" ).fetchXMLFeed;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;

const SPECTRUM_NEWS_BASE_URL = "https://spectrumnews.org/feed/";

const DX_DOI_BASE_URL = "http://dx.doi.org";
const SCI_HUB_BASE_URL = DX_DOI_BASE_URL + ".sci-hub.tw/";

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
					finalResults.push({
						title: wTitle ,
						doiB64: EncodeB64( wTitle ) ,
						mainURL: wResults[ i ][ "link" ]
					});
				}
			}

			resolve( finalResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}


function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "\nSpectrumNews.org Scan Started" );
			PrintNowTime();			

			// 1. ) Fetch Latest Results
			var wResults = await FetchXMLFeed( SPECTRUM_NEWS_BASE_URL );
			wResults = await PARSE_XML_RESULTS( wResults );

			// 2.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 3.) Post Results
			if ( wResults ) {
				console.log( wResults );
				var wFormattedTweets = [];
				for ( var i = 0; i < wResults.length; ++i ) {
					var wMessage = "#AutismResearch ";
					if ( wResults[i].title.length > 460 ) {
						wMessage = wMessage + wResults[i].title.substring( 0 , 457 );
						wMessage = wMessage + "...";
					}
					else {
						wMessage = wMessage + wResults[i].title.substring( 0 , 460 );
					}
					if ( wResults[i].mainURL ) {
						wMessage = wMessage + " " + wResults[i].mainURL;
					}
					wFormattedTweets.push( wMessage );
				}
				console.log( wFormattedTweets );
				await PostResults( wFormattedTweets );
			}			

			console.log( "\nSpectrumNews.org Scan Finished" );
			console.log( "" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;