const cheerio = require( "cheerio" );
const { map } = require( "p-iteration" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FetchXMLFeed = require( "../UTILS/genericUtils.js" ).fetchXMLFeed;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;
const RSS_URLS = require( "../CONSTANTS/elsevierhealth.js" ).RSS_URLS;

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

		var wFoundInTitle = false;
		var wTitle = null;
		if ( wResults[ i ][ "title" ] ) {
			wTitle = wResults[ i ][ "title" ];
			wFoundInTitle = scanText( wTitle );
		}
		var wFoundInDescription = false;
		var wDescription = null;
		if ( wResults[ i ][ "description" ] ) {
			wDescription = wResults[ i ][ "description" ];
			scanText( wDescription );
		}
		// var wFoundInSummary = false;
		// var wSummary = null;
		// if ( wResults[ i ][ "summary" ] ) {
		// 	wSummary = wResults[ i ][ "summary" ];
		// 	wFoundInSummary = scanText( wSummary );
		// }

		if ( wFoundInTitle || wFoundInDescription /*|| wFoundInSummary*/ ) {
			wTitle = wTitle.trim();
			console.log( wTitle );
			console.log( wMainURL );
			var wMainURL = wResults[ i ][ "link" ];
			finalResults.push({
				title: wTitle ,
				mainURL: wMainURL ,
			});
		}

	}
	return finalResults;
}

// RSS_URLS
// --> link --> <div class="doi"> <a href="http://dx.doi.org/xxxxxx
// --> paper = base_link / pdf
function SEARCH_SINGLE_ELSEVIER_ARTICLE( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {
			
			var wBody = await MakeRequest( wURL );
			try { var $ = cheerio.load( wBody ); }
			catch( err ) { resolve( "fail" ); return; }

			var wDOI = $( ".doi" ).children( "a" );
			wDOI = $( wDOI ).attr( "href" );
			wDOI = wDOI.split( "/doi.org/" )[1];
			resolve( wDOI );
		}
		catch( error ) { console.log( error ); resolve( "fail" ); }
	});
}

function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "\nElevierHealth.com Scan Started" );
			console.log( "" );
			var wNow = PrintNowTime();

			// 1. ) Fetch Latest RSS-Results Matching "autism-keywords"
			var wFinalResults = [];
			for ( var i = 0; i < RSS_URLS.length; ++i ) {
				console.log( "\nBatch [ " + ( i + 1 ).toString() + " ] of " + RSS_URLS.length.toString() );
				var wResults = await map( RSS_URLS[ 0 ] , wURL => FetchXMLFeed( wURL ) );
				wResults = wResults.map( x => PARSE_XML_RESULTS( x ) );
				wResults = [].concat.apply( [] , wResults );
				wFinalResults = [].concat.apply( [] , wResults );
			}
			console.log( wFinalResults );

			// 2.) Gather 'Meta' info for each Matched Item
			var wMetaURLS = wResults.map( x => x[ "mainURL" ] );
			wMetaURLS = await map( wMetaURLS , wURL => SEARCH_SINGLE_ELSEVIER_ARTICLE( wURL ) );
			for ( var i = 0; i < wResults.length; ++i ) {
				wResults[ i ][ "doi" ] = wMetaURLS[ i ];
				wResults[ i ][ "doiB64" ] = EncodeB64( wMetaURLS[ i ] );
				if ( wMetaURLS[ i ] !== "fail" ) {
					wResults[ i ][ "scihubURL" ] = SCI_HUB_BASE_URL + wMetaURLS[ i ];
				}
			}

			// 3.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 4.) Post Results
			await PostResults( wResults );

			console.log( "\nElevierHealth.com Scan Finished" );
			console.log( "" );
			console.log( "Started @ " );
			console.log( wNow );
			console.log( "Finished @" );
			var wLater = PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;


// 	--> Advanced Search
// http://www.allergologyinternational.com/search/advanced?journalCode=alit&seriesIssn=1323-8930&searchType=advanced
// http://bjaed.org.marlin-prod.literatumonline.com/search/advanced?journalCode=bjae&seriesIssn=2058-5349&searchType=advanced
// http://britishjournalofanaesthesia.marlin-prod.literatumonline.com/search/advanced?journalCode=bja&seriesIssn=0007-0912&searchType=advanced
// http://www.cppah.com/search/advanced?journalCode=ymps&seriesIssn=1538-5442&searchType=advanced
// http://www.ebiomedicine.com/search/advanced?journalCode=ebiom&seriesIssn=2352-3964&searchType=advanced
// http://www.nursingplus.com/search/advanced?searchType=advanced
// http://www.oncologyadvance.com/search/advanced?searchType=advanced
// http://journals.lww.com/pain/pages/advancedsearch.aspx
// http://www.theclinics.com/search/advanced?searchType=advanced
// http://www.urologyadvance.com/search/advanced?searchType=advanced