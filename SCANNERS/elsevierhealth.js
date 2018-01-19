require("shelljs/global");
const puppeteer = require( "puppeteer" );
const cheerio = require( "cheerio" );
const { map } = require( "p-iteration" );

const redis = require( "../UTILS/redisManager.js" ).redisClient;
const RU = require( "../UTILS/redisUtils.js" );
const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FetchXMLFeed = require( "../UTILS/genericUtils.js" ).fetchXMLFeedBasic;
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

		if ( !wResults[ i ] ) { continue; }
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
			var wMainURL = wResults[ i ][ "link" ];
			if ( !wMainURL ) {
				console.log( wResults[ i ] );
				continue;
				//process.exit(1);
			}
			var xFinal0BJ = { title: wTitle , mainURL: wMainURL };
			var elsevier_article_id = wMainURL.split( "/fulltext?rss=yes" )[ 0 ];
			if ( elsevier_article_id ) {
				elsevier_article_id = elsevier_article_id.split( "article/" )[ 1 ];
				if ( elsevier_article_id ) {
					xFinal0BJ[ "elsevierAID" ] = elsevier_article_id;
					xFinal0BJ[ "elsevierAIDB64" ] = EncodeB64( elsevier_article_id );
				}
			}
			console.log( xFinal0BJ );
			finalResults.push( xFinal0BJ );
		}

	}
	return finalResults;
}

function CUSTOM_PUPPETEER_FETCHER( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( wURL );
			const browser = await puppeteer.launch({ headless: true , /* slowMo: 2000 */  });
			const page = await browser.newPage();
			await page.setViewport( { width: 1200 , height: 700 } );
			//await page.setJavaScriptEnabled( false );
			await page.goto( wURL , { timeout: ( 120 * 1000 ) , waitUntil: "networkidle0" } );
			//await page.waitFor( 6000 );
			const wBody = await page.content();
			await browser.close();
			exec( "pkill -9 chrome" , { silent: true ,  async: false } );
			resolve( wBody );			
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

// RSS_URLS
// --> link --> <div class="doi"> <a href="http://dx.doi.org/xxxxxx
// --> paper = base_link / pdf
function SEARCH_SINGLE_ELSEVIER_ARTICLE( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "Searching --> " + wURL );
			var wBody = await CUSTOM_PUPPETEER_FETCHER( wURL );
			try { var $ = cheerio.load( wBody ); }
			catch( err ) { console.log( "cheerio fail" ); resolve( "fail" ); return; }

			var wDOI = $( ".doi" );
			if ( !wDOI ) { console.log( "no .doi divs ?" ); resolve( "fail" ); return; }
			wDOI = $( wDOI[ 0 ] ).find( "a" );
			if ( !wDOI ) { console.log( "no <a> tags ?" ); resolve( "fail" ); return; }
			wDOI = $( wDOI[ 0 ] ).attr( "href" );
			if ( !wDOI ) { console.log( "no href attribute ?" ); resolve( "fail" ); return; }
			wDOI = wDOI.split( "doi.org/" )[ 1 ];
			if ( !wDOI ) { console.log( "no doi ?" ); resolve( "fail" ); return; }

			resolve( { "doi":  wDOI } );
		}
		catch( error ) { console.log( error ); resolve( "fail" ); }
	});
}

const R_ELSIEVER_ARTICLES = "SCANNERS_ELSIEVER.ALREADY_TRACKED";
function FILTER_ALREADY_TRACKED_ELSIEVER_ARTICLE_IDS( wResults ) {
	return new Promise( async function( resolve , reject ) {
		try {
			var wArticleIDS_B64 = wResults.map( x => x[ "elsevierAIDB64" ] );
			//console.log( wArticleIDS_B64 );

			// 1.) Generate Random-Temp Key
			var wTempKey = Math.random().toString(36).substring(7);
			var R_PLACEHOLDER = "SCANNERS." + wTempKey + ".PLACEHOLDER";
			var R_NEW_TRACKING = "SCANNERS." + wTempKey + ".NEW_TRACKING";

			await RU.setSetFromArray( redis , R_PLACEHOLDER , wArticleIDS_B64 );
			await RU.setDifferenceStore( redis , R_NEW_TRACKING , R_PLACEHOLDER , R_ELSIEVER_ARTICLES );
			await RU.delKey( redis , R_PLACEHOLDER );
			//await RU.setSetFromArray( redis , R_GLOBAL_ALREADY_TRACKED_DOIS , wArticleIDS_B64 );

			const wNewTracking = await RU.getFullSet( redis , R_NEW_TRACKING );
			if ( !wNewTracking ) { 
				await RU.delKey( redis , R_NEW_TRACKING ); 
				console.log( "nothing new found" ); 
				PrintNowTime(); 
				resolve( [] );
				return;
			}
			if ( wNewTracking.length < 1 ) {
				await RU.delKey( redis , R_NEW_TRACKING );
				console.log( "nothing new found" ); 
				PrintNowTime();
				resolve( [] );
				return;
			}
			wResults = wResults.filter( x => wNewTracking.indexOf( x[ "elsevierAIDB64" ] ) !== -1 );
			await RU.delKey( redis , R_NEW_TRACKING );
			resolve( wResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
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
				var wResults = await map( RSS_URLS[ i ] , wURL => FetchXMLFeed( wURL ) );
				var parsedResults = wResults.map( x => PARSE_XML_RESULTS( x ) );
				parsedResults = [].concat.apply( [] , parsedResults );
				for ( var j = 0; j < parsedResults.length; ++j ) {
					wFinalResults.push( parsedResults[ j ] );
				}
			}

			// 2.) Compare to already "meta-data-gathered" elsiever articles
			wFinalResults = await FILTER_ALREADY_TRACKED_ELSIEVER_ARTICLE_IDS( wFinalResults );
			console.log( wFinalResults );

			// 3.) Gather 'Meta' info for each Matched Item
			for ( var i = 0; i < wFinalResults.length; ++i ) {
				var wMeta = await SEARCH_SINGLE_ELSEVIER_ARTICLE( wFinalResults[ i ][ "mainURL" ] );
				if ( !wMeta ) { continue; }
				if ( wMeta === "fail" ) { continue; }
				wFinalResults[ i ][ "doi" ] = wMeta[ "doi" ];
				wFinalResults[ i ][ "doiB64" ] = EncodeB64( wMeta[ "doi" ] );
				wFinalResults[ i ][ "scihubURL" ] = SCI_HUB_BASE_URL + wMeta[ "doi" ];
				await RU.setAdd( redis , R_ELSIEVER_ARTICLES , wFinalResults[ i ][ "elsevierAIDB64" ] );
				console.log( wFinalResults[ i ] );
			}
			console.log( wFinalResults );


			// 4.) Compare to Already 'Tracked' DOIs and Store Uneq
			wFinalResults = await FilterUNEQResultsREDIS( wFinalResults );

			// 5.) Post Results
			await PostResults( wFinalResults );

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