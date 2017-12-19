const cheerio = require( "cheerio" );
const { map } = require( "p-iteration" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FetchXMLFeed = require( "../UTILS/genericUtils.js" ).fetchXMLFeed;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = "http://dx.doi.org";
const SCI_HUB_BASE_URL = DX_DOI_BASE_URL + ".sci-hub.tw/";

const KARGER_RSS_URLS = [
	"http://www.karger.com/Rss/ACY" ,
	"http://www.karger.com/Rss/AHA" ,
	"http://www.karger.com/Rss/AJN" ,
	"http://www.karger.com/Rss/ANM" ,
	"http://www.karger.com/Rss/AUD" ,
	"http://www.karger.com/Rss/AUE" ,
	"http://www.karger.com/Rss/BPU" ,
	"http://www.karger.com/Rss/BBE" ,
	"http://www.karger.com/Rss/BRC" ,
	"http://www.karger.com/Rss/CRD" ,
	"http://www.karger.com/Rss/CRM" ,
	"http://www.karger.com/Rss/CRE" ,
	"http://www.karger.com/Rss/CDE" ,
	"http://www.karger.com/Rss/CRG" ,
	"http://www.karger.com/Rss/CND" ,
	"http://www.karger.com/Rss/CRN" ,
	"http://www.karger.com/Rss/CRO" ,
	"http://www.karger.com/Rss/COP" ,
	"http://www.karger.com/Rss/CTO" ,
	"http://www.karger.com/Rss/CPB" ,
	"http://www.karger.com/Rss/CED" ,
	"http://www.karger.com/Rss/CEE" ,
	"http://www.karger.com/Rss/CHE" ,
	"http://www.karger.com/Rss/CUR" ,
	"http://www.karger.com/Rss/CGR" ,
	"http://www.karger.com/Rss/DEM" ,
	"http://www.karger.com/Rss/DEE" ,
	"http://www.karger.com/Rss/DRM" ,
	"http://www.karger.com/Rss/DPA" ,
	"http://www.karger.com/Rss/DNE" ,
	"http://www.karger.com/Rss/DIG" ,
	"http://www.karger.com/Rss/DDI" ,
	"http://www.karger.com/Rss/DSU" ,
	"http://www.karger.com/Rss/EAR" ,
	"http://www.karger.com/Rss/ENE" ,
	"http://www.karger.com/Rss/ESR" ,
	"http://www.karger.com/Rss/ETJ" ,
	"http://www.karger.com/Rss/FDT" ,
	"http://www.karger.com/Rss/FPL" ,
	"http://www.karger.com/Rss/FPR" ,
	"http://www.karger.com/Rss/FOK" ,
	"http://www.karger.com/Rss/GAT" ,
	"http://www.karger.com/Rss/GER" ,
	"http://www.karger.com/Rss/GOI" ,
	"http://www.karger.com/Rss/HRP" ,
	"http://www.karger.com/Rss/HDE" ,
	"http://www.karger.com/Rss/HHE" ,
	"http://www.karger.com/Rss/IID" ,
	"http://www.karger.com/Rss/IMI" ,
	"http://www.karger.com/Rss/IAA" ,
	"http://www.karger.com/Rss/INE" ,
	"http://www.karger.com/Rss/INT" ,
	"http://www.karger.com/Rss/JIN" ,
	"http://www.karger.com/Rss/MMB" ,
	"http://www.karger.com/Rss/JNN" ,
	"http://www.karger.com/Rss/JVR" ,
	"http://www.karger.com/Rss/KKD" ,
	"http://www.karger.com/Rss/KKO" ,
	"http://www.karger.com/Rss/KOP" ,
	"http://www.karger.com/Rss/KKP" ,
	"http://www.karger.com/Rss/KBR" ,
	"http://www.karger.com/Rss/KDD" ,
	"http://www.karger.com/Rss/LIC" ,
	"http://www.karger.com/Rss/MEE" ,
	"http://www.karger.com/Rss/MPP" ,
	"http://www.karger.com/Rss/MSY" ,
	"http://www.karger.com/Rss/NEO" ,
	"http://www.karger.com/Rss/NEF" ,
	"http://www.karger.com/Rss/NNE" ,
	"http://www.karger.com/Rss/NDD" ,
	"http://www.karger.com/Rss/NEN" ,
	"http://www.karger.com/Rss/NED" ,
	"http://www.karger.com/Rss/NIM" ,
	"http://www.karger.com/Rss/NPS" ,
	"http://www.karger.com/Rss/OFA" ,
	"http://www.karger.com/Rss/OOP" ,
	"http://www.karger.com/Rss/OCL" ,
	"http://www.karger.com/Rss/ORT" ,
	"http://www.karger.com/Rss/ORE" ,
	"http://www.karger.com/Rss/OPH" ,
	"http://www.karger.com/Rss/OPX" ,
	"http://www.karger.com/Rss/ORL" ,
	"http://www.karger.com/Rss/PAT" ,
	"http://www.karger.com/Rss/PNE" ,
	"http://www.karger.com/Rss/PHA" ,
	"http://www.karger.com/Rss/PHO" ,
	"http://www.karger.com/Rss/PSP" ,
	"http://www.karger.com/Rss/PPS" ,
	"http://www.karger.com/Rss/PHG" ,
	"http://www.karger.com/Rss/PLS" ,
	"http://www.karger.com/Rss/RES" ,
	"http://www.karger.com/Rss/SZG" ,
	"http://www.karger.com/Rss/SXD" ,
	"http://www.karger.com/Rss/SAD" ,
	"http://www.karger.com/Rss/SPP" ,
	"http://www.karger.com/Rss/SFN" ,
	"http://www.karger.com/Rss/TMH" ,
	"http://www.karger.com/Rss/UIN" ,
	"http://www.karger.com/Rss/VER" ,
	"http://www.karger.com/Rss/VIM" ,
];

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
			catch( err ) { resolve( "cheerio load failed" ); return; }

			var wDOI = $( ".articleDetails" ).children();
			wDOI = $( wDOI[1] ).children();
			wDOI = $( wDOI[0] ).children( "a" );
			wDOI = $( wDOI[0] ).attr( "href" );
			wDOI = wDOI.split( "https://doi.org/" )[1];
			resolve( wDOI );
		}
		catch( error ) { console.log( error ); reject( error ); }
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
				wResults[ i ][ "scihubURL" ] = SCI_HUB_BASE_URL + wMetaURLS[ i ];
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