const puppeteer = require( "puppeteer" );
const cheerio = require( "cheerio" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;
const wSleep = require( "../UTILS/genericUtils.js" ).wSleep;
const KillChrome = require( "../UTILS/genericUtils.js" ).killChrome;
const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

const BMJ_URL_B1 = "https://www.bmj.com/search/advanced/text_abstract_title%3Aautism%2Bautistic%2B%20text_abstract_title_flags%3Amatch-any%20limit_from%3A";
const BMJ_URL_B2 = "%20limit_to%3A";
const BMJ_URL_B3 = "%20numresults%3A100%20sort%3Apublication-date%20direction%3Adescending%20format_result%3Astandard";
function BUILD_SEARCH_URL() {
	var previous = new Date();
	previous.setDate( previous.getDate() - 60 );
	const wPY = previous.getFullYear();
	const wPM = ( previous.getMonth() + 1 );
	const wPD = previous.getDate();
	var future = new Date();
	future.setDate( future.getDate() + 360 );
	const wFY = future.getFullYear().toString();
	const wFM = ( future.getMonth() + 1 );
	const wFD = future.getDate();
	return BMJ_URL_B1 + wPY + "-" + wPM + "-" + wPD + BMJ_URL_B2 + wFY + "-" + wFM + "-" + wFD + BMJ_URL_B3;
}

const BMJ_DOI_BASE = "10.1136/bmj.";
const SOURCE_PAPER_LINK_BASE = "https://www.bmj.com/content/";
function CUSTOM_CHEERIO_SEARCH( wBody ) {
	try { var $ = cheerio.load( wBody ); }
	catch( err ) { return "fail"; }
	var finalResults = [];
	var resultItems = $( "ul.highwire-search-results-list" ).children();
	for ( var i = 0; i < resultItems.length; ++i ) {
		var a_child = $( resultItems[ i ] ).children();
		if ( a_child ) {
			if ( a_child[ 0 ] ) {
				var b_child = $( a_child[ 0 ] ).children();
				if ( b_child ) {
					if ( b_child[ 0 ] ) {
						var c_child = $( b_child[ 0 ] ).children( "a" );
						if ( c_child ) {
							if ( c_child[ 0 ] ) {
								var wTitle = $( c_child[ 0 ] ).text();
								if ( wTitle ) { wTitle = wTitle.trim(); }
								var wDOI_Fragment = $( c_child[ 0 ] ).attr( "href" );
								if ( wDOI_Fragment ) {
									var xdoi = wDOI_Fragment.split( "/" );
									if ( xdoi ) {
										if ( xdoi[ 3 ] ) {
											var end = xdoi[ 3 ].split( "." );
											end = end[ 1 ];
											const wDOI = BMJ_DOI_BASE + end;
											finalResults.push({
												title: wTitle ,
												mainURL: SOURCE_PAPER_LINK_BASE + xdoi[ 2 ] + "/" + xdoi[ 3 ] ,
												doi: wDOI ,
												doiB64: EncodeB64( wDOI ) ,
												paperURL: SOURCE_PAPER_LINK_BASE + xdoi[ 2 ] + "/" + xdoi[ 3 ] + ".full.pdf" ,
												scihubURL: SCI_HUB_BASE_URL + wDOI
											});											
										}
									}
								}
							}
						}
					}
				}
			}
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
			await page.goto( wURL , { timeout: ( 30 * 1000 ) , waitUntil: "networkidle0" } );
			//await page.waitFor( 6000 );
			const wBody = await page.content();
			await browser.close();
			resolve( wBody );			
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "" );
			console.log( "bmj.com Scan Started" );
			PrintNowTime();			
			
			// 1.) Build URL
			const wURL = BUILD_SEARCH_URL();
			
			// 2.) Get Page-Body
			var wResults = await CUSTOM_PUPPETEER_FETCHER( wURL );
			
			// 3.) Gather Results
			wResults = CUSTOM_CHEERIO_SEARCH( wResults );
			
			// 4.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );
			console.log( wResults );

			// 5.) Post Results
			await PostResults( wResults );

			//KillChrome();

			console.log( "" );
			console.log( "bmj.com Scan Finished" );
			PrintNowTime();			
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;