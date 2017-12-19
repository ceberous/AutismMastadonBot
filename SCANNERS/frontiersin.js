const { map } = require( "p-iteration" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FetchXMLFeed = require( "../UTILS/genericUtils.js" ).fetchXMLFeed;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = "http://dx.doi.org";
const SCI_HUB_BASE_URL = DX_DOI_BASE_URL + ".sci-hub.tw/";

// https://www.frontiersin.org/blog/Frontiers_Social_Media_and_RSS/496

// pubDate2017-12-17T11:16:01.8510529+00:00
const FRONTIERSIN_URLS = [
	"https://www.frontiersin.org/journals/aging-neuroscience/rss" ,
	"https://www.frontiersin.org/journals/applied-mathematics-and-statistics/rss" ,
	"https://www.frontiersin.org/journals/astronomy-and-space-sciences/rss" ,
	"https://www.frontiersin.org/journals/behavioral-neuroscience/rss" ,
	"https://www.frontiersin.org/journals/bioengineering-and-biotechnology/rss" ,
	"https://www.frontiersin.org/journals/built-environment/rss" ,
	"https://www.frontiersin.org/journals/cardiovascular-medicine/rss" ,
	"https://www.frontiersin.org/journals/cell-and-developmental-biology/rss" ,
	"https://www.frontiersin.org/journals/cellular-and-infection-microbiology/rss" ,
	"https://www.frontiersin.org/journals/cellular-neuroscience/rss" ,
	"https://www.frontiersin.org/journals/chemistry/rss" ,
	"https://www.frontiersin.org/journals/communication/rss" ,
	"https://www.frontiersin.org/journals/computational-neuroscience/rss" ,
	"https://www.frontiersin.org/journals/digital-humanities/rss" ,
	"https://www.frontiersin.org/journals/earth-science/rss" ,
	"https://www.frontiersin.org/journals/ecology-and-evolution/rss" ,
	"https://www.frontiersin.org/journals/education/rss" ,
	"https://www.frontiersin.org/journals/endocrinology/rss" ,
	"https://www.frontiersin.org/journals/energy-research/rss" ,
	"https://www.frontiersin.org/journals/environmental-science/rss" ,
	"https://www.frontiersin.org/journals/genetics/rss" ,
	"https://www.frontiersin.org/journals/human-neuroscience/rss" ,
	"https://www.frontiersin.org/journals/ict/rss" ,
	"https://www.frontiersin.org/journals/immunology/rss" ,
	"https://www.frontiersin.org/journals/integrative-neuroscience/rss" ,
	"https://www.frontiersin.org/journals/marine-science/rss" ,
	"https://www.frontiersin.org/journals/materials/rss" ,
	"https://www.frontiersin.org/journals/medicine/rss" ,
	"https://www.frontiersin.org/journals/microbiology/rss" ,
	"https://www.frontiersin.org/journals/molecular-biosciences/rss" ,
	"https://www.frontiersin.org/journals/molecular-neuroscience/rss" ,
	"https://www.frontiersin.org/journals/neural-circuits/rss" ,
	"https://www.frontiersin.org/journals/neuroanatomy/rss" ,
	"https://www.frontiersin.org/journals/neuroenergetics/rss" ,
	"https://www.frontiersin.org/journals/neuroengineering/rss" ,
	"https://www.frontiersin.org/journals/neuroinformatics/rss" ,
	"https://www.frontiersin.org/journals/neurology/rss" ,
	"https://www.frontiersin.org/journals/neurorobotics/rss" ,
	"https://www.frontiersin.org/journals/neuroscience/rss" ,
	"https://www.frontiersin.org/journals/nutrition/rss" ,
	"https://www.frontiersin.org/journals/oncology/rss" ,
	"https://www.frontiersin.org/journals/pediatrics/rss" ,
	"https://www.frontiersin.org/journals/pharmacology/rss" ,
	"https://www.frontiersin.org/journals/physics/rss" ,
	"https://www.frontiersin.org/journals/physiology/rss" ,
	"https://www.frontiersin.org/journals/plant-science/rss" ,
	"https://www.frontiersin.org/journals/psychiatry/rss" ,
	"https://www.frontiersin.org/journals/psychology/rss" ,
	"https://www.frontiersin.org/journals/public-health/rss" ,
	"https://www.frontiersin.org/journals/robotics-and-ai/rss" ,
	"https://www.frontiersin.org/journals/research-metrics-and-analytics/rss" ,
	"https://www.frontiersin.org/journals/sociology/rss" ,
	"https://www.frontiersin.org/journals/surgery/rss" ,
	"https://www.frontiersin.org/journals/synaptic-neuroscience/rss" ,
	"https://www.frontiersin.org/journals/systems-neuroscience/rss" ,
	"https://www.frontiersin.org/journals/veterinary-science/rss" ,
];

//https://www.frontiersin.org/articles/10.3389/fnsys.2017.00093/pdf

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