const cheerio = require( "cheerio" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = "http://dx.doi.org";
const SCI_HUB_BASE_URL = DX_DOI_BASE_URL + ".sci-hub.tw/";

const UNMC_SEARCH_URL_BASE = "https://www.unmc.edu/newsfeed/index.php/json/getnews/?f=research&o=0&l=5";
// "https://www.unmc.edu/newsfeed/index.php/json/getnews/?f=research&o=20&l=5"
const UNMC_ARTICLE_URL_BASE = "https://www.unmc.edu/news.cfm?match=";
// var wArticleSearchURL = UNMC_ARTICLE_URL_BASE + wArticlID;


function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "\nunmc.edu Scan Started" );
			console.log( "" );
			PrintNowTime();			

			// 1. ) Fetch Latest Results
			

			// 2.) Compare to Already 'Tracked' DOIs and Store Uneq
			// var b64_DOIS = finalResults.map( x => x[ "doiB64" ] );
			// await RU.setSetFromArray( redis , R_UNMC_PLACEHOLDER , b64_DOIS );
			// await RU.setDifferenceStore( redis , R_UNMC_NEW_TRACKING , R_UNMC_PLACEHOLDER , R_GLOBAL_ALREADY_TRACKED_DOIS );
			// await RU.delKey( redis , R_UNMC_PLACEHOLDER );
			// await RU.setSetFromArray( redis , R_GLOBAL_ALREADY_TRACKED_DOIS , b64_DOIS );

			// const wNewTracking = await RU.getFullSet( redis , R_UNMC_NEW_TRACKING );
			// if ( !wNewTracking ) { console.log( "nothing new found" ); PrintNowTime(); resolve(); return; }
			// if ( wNewTracking.length < 1 ) { console.log( "nothing new found" ); PrintNowTime(); resolve(); return; }
			// finalResults = finalResults.filter( x => wNewTracking.indexOf( x[ "doiB64" ] ) !== -1 );
			// await RU.delKey( redis , R_UNMC_NEW_TRACKING );
			
			// // 3.) Post Results
			// await PostResults( finalResults );

			console.log( "\nunmc.edu Scan Finished" );
			console.log( "" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;