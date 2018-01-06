const cheerio = require( "cheerio" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

String.prototype.ltrim = function() {
	return this.replace(/^\s+/,"");
}
String.prototype.rtrim = function() {
	return this.replace(/\s+$/,"");
}

function PARSE_SEARCH_RESULTS( wBody ) {
	try { var $ = cheerio.load( wBody ); }
	catch( err ) {  return "fail"; }
	var wTitles = [];
	var wLinks = [];
	var wDOIS = [];
	$( ".searchresults" ).each( function() {
		var x1 = $( this ).children();
		if ( x1 ) {
			var x1_Title = $( x1[ 0 ] ).text();
			var x1_Link = $( x1[ 0 ] ).attr( "href" );
			if ( x1_Title ) { x1_Title = x1_Title.trim(); x1_Title = x1_Title.replace(/ +(?= )/g,''); wTitles.push( x1_Title ); }
			if ( x1_Link ) { wLinks.push( x1_Link ); }
		}
	});
	$( ".searchcitation" ).each( function() {
		var x1 = $( this ).text();
		if ( x1 ) {
			x1 = x1.trim();
			if ( x1.indexOf( "doi:" ) !== -1 ) {
				x1 = x1.split( "doi:" )[ 1 ];
				x1 = x1.ltrim();
				wDOIS.push( x1 );
			}
		}
	});

	var finalResults = [];
	if ( wTitles.length === wLinks.length ) {
		for ( var i = 0; i < wTitles.length; ++i ) {
			var x1_OBJ = {
				title: wTitles[ i ] ,
				mainURL: wLinks[ i ]
			};
			if ( wDOIS[ i ] !== undefined ) {
				x1_OBJ[ "doi" ] = wDOIS[ i ];
				x1_OBJ[ "doiB64" ] = EncodeB64( wDOIS[ i ] );
				x1_OBJ[ "scihubURL" ] =  SCI_HUB_BASE_URL + wDOIS[ i ];
			}
			finalResults.push( x1_OBJ );
		}
	}
	return finalResults;
}

const EHP_NIEHS_NIH_SEARCH_URL = "https://ehp.niehs.nih.gov/search-ehp/?fwp_title_search_facet=autism&fwp_abstract_search_facet=autism&fwp_sort=date_desc";
function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "\nEHP.NIEHS.NIH.gov Scan Started" );
			console.log( "" );
			PrintNowTime();

			// 1.) Search for Results
			var wBody = await MakeRequest( EHP_NIEHS_NIH_SEARCH_URL );

			// 2.) Parse Results
			var wResults = PARSE_SEARCH_RESULTS( wBody );
 
			// 3.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 4.) Post Results
			await PostResults( wResults );

			console.log( "\nEHP.NIEHS.NIH.gov Scan Finished" );
			console.log( "" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;