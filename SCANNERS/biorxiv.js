const { map } = require( "p-iteration" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FetchXMLFeed = require( "../UTILS/genericUtils.js" ).fetchXMLFeed;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = "http://dx.doi.org";
const SCI_HUB_BASE_URL = DX_DOI_BASE_URL + ".sci-hub.tw/";


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

function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "" );
			console.log( "\nBiorxiv.org Scan Started" );
			PrintNowTime();

			// 1. ) Fetch Results
			var wResults = await map( BIORXIV_FEED_URLS , wURL => FetchXMLFeed( wURL ) );
			wResults = [].concat.apply( [] , wResults );
			wResults = wResults.map( x => PARSE_XML_RESULTS( x ) );
			wResults = wResults.filter( x => x !== undefined );

			// 2.) Filter Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 3.) Post Uneq
			await PostResults( wResults );

			console.log( "\nBiorxiv.org Scan Finished" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;