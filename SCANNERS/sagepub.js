const puppeteer = require( "puppeteer" );
const cheerio = require( "cheerio" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;
const wSleep = require( "../UTILS/genericUtils.js" ).wSleep;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

const SAGE_PUB_ARTICLE_BASE = "http://journals.sagepub.com";
function PARSE_SEARCH_RESULTS( wBody ) {
	try { var $ = cheerio.load( wBody ); }
	catch( err ) { return "fail"; }
	var finalResults = [];
	$( 'a[data-item-name="click-article-title"]' ).each( function() {
		var wTitle = $( this ).text();
		if ( !wTitle ) { return false; }
		wTitle = wTitle.trim();
		var wDOI = $( this ).attr( "href" );
		if ( !wDOI ) { return false; }
		var x1 = wDOI.split( "/doi/full/" );
		if ( !x1 ) { return false; }
		if ( !x1[ 1 ] ) { return false; }
		x1 = x1[ 1 ];
		finalResults.push({
			title: wTitle ,
			mainURL: SAGE_PUB_ARTICLE_BASE + wDOI ,
			doi: x1 ,
			doiB64: EncodeB64( x1 ) ,
			scihubURL: SCI_HUB_BASE_URL + x1
		});
	});
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
			resolve( wBody );			
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}


const SAGE_PUB_SEARCH_URL = "http://journals.sagepub.com/action/doSearch?Ppub=20170709-20180109&content=articlesChapters&countTerms=true&field1=Title&field2=Abstract&field3=Title&field4=Abstract&target=default&text1=autism&text2=autism&text3=autistic&text4=autistic&sortBy=Ppub&pageSize=50";
function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "" );
			console.log( "Journals.SagePub.com Scan Started" );
			PrintNowTime();			

			// 1. ) Fetch Latest RSS-Results Matching "autism-keywords"
			var wResults = await CUSTOM_PUPPETEER_FETCHER( SAGE_PUB_SEARCH_URL );
			
			// 2.) Parse Results
			wResults = PARSE_SEARCH_RESULTS( wResults );
			
			// 3.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 4.) Post Results
			await PostResults( wResults );

			console.log( "" );
			console.log( "Journals.SagePub.com Scan Finished" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;