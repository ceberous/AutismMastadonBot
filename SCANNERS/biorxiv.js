const cheerio = require( "cheerio" );
const { map } = require( "p-iteration" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FetchXMLFeed = require( "../UTILS/genericUtils.js" ).fetchXMLFeed;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

const BIORXIV_FEED_URLS = [
	"http://connect.biorxiv.org/biorxiv_xml.php?subject=bioinformatics" ,
	"http://connect.biorxiv.org/biorxiv_xml.php?subject=biophysics" ,
	"http://connect.biorxiv.org/biorxiv_xml.php?subject=cancer_biology" ,
	"http://connect.biorxiv.org/biorxiv_xml.php?subject=cell_biology" ,
	"http://connect.biorxiv.org/biorxiv_xml.php?subject=ecology" ,
	"http://connect.biorxiv.org/biorxiv_xml.php?subject=genetics" ,
	"http://connect.biorxiv.org/biorxiv_xml.php?subject=genomics" ,
	"http://connect.biorxiv.org/biorxiv_xml.php?subject=microbiology" ,
	"http://connect.biorxiv.org/biorxiv_xml.php?subject=neuroscience" ,
	"http://connect.biorxiv.org/biorxiv_xml.php?subject=systems_biology" ,
];

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

	var wTitle = wResults[ "title" ];
	var wFoundInTitle = scanText( wTitle );
	
	var wDescription = wResults[ "description" ];
	var wFoundInDescription = scanText( wDescription );

	if ( wFoundInTitle || wFoundInDescription ) {
		var wDOI = wResults[ "dc:identifier" ][ "#" ];
		wDOI = wDOI.split( "doi:" )[1];
		return {
			title: wTitle ,
			doi: wDOI ,
			doiB64: EncodeB64( wDOI ) ,
			mainURL: DX_DOI_BASE_URL + "/" + wDOI ,
			scihubURL: SCI_HUB_BASE_URL + wDOI
		}
	}
	return undefined;
}

function PARSE_SEARCH_RESULTS( wBody ) {
	try { var $ = cheerio.load( wBody ); }
	catch( err ) { return "fail"; }
	var finalResults = [];
	var wChild_List = $( ".highwire-search-results-list" ).children();
	if ( !wChild_List ) { return "fail"; }
	$( wChild_List ).each( function() {
		var wThis = $( this ).children();
		if ( !wThis ) { return false; }
		var wTitle = $( wThis[ 0 ] ).find( ".highwire-cite-title" );
		if ( !wTitle ) { return false; }
		wTitle = $( wTitle[ 0 ] ).text();
		if ( !wTitle ) { return false; }
		wTitle = wTitle.trim();
		var wDOI = $( wThis[ 0 ] ).find( ".highwire-cite-metadata-doi" );
		if ( !wDOI ) { return false; }
		wDOI = $( wDOI[ 0 ] ).text();
		if ( !wDOI ) { return false; }
		if ( wDOI.indexOf( "/doi.org/" ) === -1 ) { return false; }
		wDOI = wDOI.split( "/doi.org/" )[1];
		wDOI = wDOI.split( " " )[0];
		if ( !wDOI ) { return false; }
		finalResults.push({
			title: wTitle ,
			mainURL: DX_DOI_BASE_URL + "/" + wDOI ,
			doi: wDOI , 
			doiB64: EncodeB64( wDOI ) ,
			scihubURL: SCI_HUB_BASE_URL + wDOI
		});
	});
	return finalResults;
}

const BIORXIV_ADVANCED_SEARCH_URL = "https://www.biorxiv.org/search/abstract_title%3Aautism%20abstract_title_flags%3Amatch-all%20numresults%3A100%20sort%3Apublication-date%20direction%3Adescending%20format_result%3Astandard";
function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "" );
			console.log( "\nBiorxiv.org Scan Started" );
			PrintNowTime();

			// 1. ) Fetch XML Results
			var wResults = await map( BIORXIV_FEED_URLS , wURL => FetchXMLFeed( wURL ) );
			wResults = [].concat.apply( [] , wResults );
			wResults = wResults.map( x => PARSE_XML_RESULTS( x ) );
			wResults = wResults.filter( x => x !== undefined );

			// 2.) Fetch Advanced Search Results
			var wAdvanced_Search_Body = await MakeRequest( BIORXIV_ADVANCED_SEARCH_URL );
			var wAdvanced_Search_Results = PARSE_SEARCH_RESULTS( wAdvanced_Search_Body );
			console.log( wAdvanced_Search_Results );

			// 3.) Combine Results
			var wAdvanced_Search_Results_DOIS = wAdvanced_Search_Results.map( x => x[ "doi" ] );
			wResults = wResults.filter( x => wAdvanced_Search_Results_DOIS.indexOf( x[ "doi" ] ) !== -1 );
			wAdvanced_Search_Results = [].concat.apply( [] , wResults );

			// 4.) Filter Uneq
			wAdvanced_Search_Results = await FilterUNEQResultsREDIS( wAdvanced_Search_Results );

			// 5.) Post Uneq
			await PostResults( wAdvanced_Search_Results );

			console.log( "\nBiorxiv.org Scan Finished" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;