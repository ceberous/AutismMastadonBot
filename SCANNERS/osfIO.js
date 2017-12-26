const request = require( "request" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

function PARSE_RESULTS( wResults ) {
	if ( wResults[ "hits" ] ) {
		if ( wResults[ "hits" ][ "hits" ] ) {
			var wFinalResults = [];
			for ( var i = 0; i < wResults[ "hits" ][ "hits" ].length; ++i ) {
				var wTitle = wResults[ "hits" ][ "hits" ][ i ][ "_source" ][ "title" ];
				var wDOI = wResults[ "hits" ][ "hits" ][ i ][ "_source" ][ "identifiers" ];
				var wFinalDOI = null;
				for ( var j = 0; j < wDOI.length; ++j ) {
					if ( wDOI[ j ].indexOf( "dx.doi.org" ) !== -1 ) {
						wFinalDOI = wDOI[ j ].split( "dx.doi.org/" )[ 1 ];
						wFinalResults.push({
							title: wTitle ,
							doi: wFinalDOI ,
							doiB64: EncodeB64( wFinalDOI ) ,
							mainURL: DX_DOI_BASE_URL + "/" + wFinalDOI ,
							scihubURL: SCI_HUB_BASE_URL + wFinalDOI
						});
						break;
					}
				}
				if ( wFinalDOI === null ) {
					for ( var j = 0; j < wDOI.length; ++j ) {
						if ( wDOI[ j ].indexOf( "ttp://arxiv.org/" ) !== -1 ) {
							wFinalDOI = wDOI[ j ];
							var wTemp = wFinalDOI.split( "arxiv.org/abs/" );
							var arxifB64 = wTemp[ 1 ];
							var paperURL = wTemp[ 0 ].split( "/abs/" )[ 0 ];
							paperURL = "https://arxiv.org/pdf/" + arxifB64;
							wFinalResults.push({
								title: wTitle ,
								doi: arxifB64 ,
								doiB64: EncodeB64( arxifB64 ) ,
								mainURL: wFinalDOI ,
								scihubURL: paperURL
							});
							break;
						}
					}
				}
			}
			return wFinalResults;
		}
	}
	else { return []; }
}

const OSF_IO_SEARCH_URL = "https://share.osf.io/api/v2/search/creativeworks/_search";
const OSF_IO_SEARCH_PAYLOAD = {"query":{"bool":{"must":{"query_string":{"query":"autism"}},"filter":[{"bool":{"should":[{"terms":{"types":["preprint"]}},{"terms":{"sources":["Thesis Commons"]}}]}},{"terms":{"sources":["OSF","AgriXiv","arXiv","BITSS","Cogprints","bioRxiv","EarthArXiv","engrXiv","FocUS Archive","INA-Rxiv","LawArXiv","LIS Scholarship Archive","MarXiv","MindRxiv","NutriXiv","PaleorXiv","PeerJ","PsyArXiv","Preprints.org","Research Papers in Economics","SocArXiv","SportRxiv","Thesis Commons"]}},{"terms":{"sources":["OSF","AgriXiv","BITSS","EarthArXiv","engrXiv","FocUS Archive","INA-Rxiv","LawArXiv","LIS Scholarship Archive","LiveData","MarXiv","MindRxiv","NutriXiv","PaleorXiv","PsyArXiv","SocArXiv","SportRxiv","Thesis Commons","arXiv","bioRxiv","Cogprints","PeerJ","Research Papers in Economics","Preprints.org"]}}]}},"from":0,"sort":{"date_updated":"desc"},"aggregations":{"sources":{"terms":{"field":"sources","size":500}}}};
const OSF_IO_SEARCH_OPTIONS = {
	url: OSF_IO_SEARCH_URL ,
	method: "POST" ,
	json: OSF_IO_SEARCH_PAYLOAD ,
	referer: "https://osf.io/preprints" ,
	origin: "https://osf.io" ,
	DNT: 1 ,
	content_type: "application/json"
};
function FETCH_RESULTS() {
	return new Promise( function( resolve , reject ) {
		try {
			request( OSF_IO_SEARCH_OPTIONS, function ( error , response , body ) {
				if ( !error && response.statusCode == 200 ) {
					resolve( body );
					return;
				}
				else { resolve( {} ); return; }
			});
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "" );
			console.log( "\nOSF.io Scan Started" );
			PrintNowTime();

			// 1. ) Fetch Results
			var wResults = await FETCH_RESULTS();
			wResults = PARSE_RESULTS( wResults );

			// 2.) Filter Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 3.) Post Uneq
			await PostResults( wResults );

			console.log( "\nOSF.io Scan Finished" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;