const process = require( "process" );

const cheerio = require( "cheerio" );
const { map } = require( "p-iteration" );
const pALL = require( "p-all" );
const puppeteer = require( "puppeteer" );

const redis = require( "../UTILS/redisManager.js" ).redisClient;
const RU = require( "../UTILS/redisUtils.js" );
const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;
const wSleep = require( "../UTILS/genericUtils.js" ).wSleep;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

var browser = null;
function SEARCH_SINGLE_SCIENCE_DIRECT_ARTICLE_PUPPETEER( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( wURL );
			//const browser = await puppeteer.launch();
			const page = await browser.newPage();
			//await page.setViewport({width: 300, height: 300});
			//await page.setJavaScriptEnabled( false );
			await page.goto( wURL , { timeout: ( 120 * 1000 ) , waitUntil: "networkidle0" } );
			var wBody = await page.content();
			//await browser.close();

			try { var $ = cheerio.load( wBody ); }
			catch( err ) { resolve( "fail" ); return; }

			var wDOI = $( ".DoiLink" );
			wDOI = $( wDOI ).children();
			wDOI = $( wDOI[ 0 ] ).attr( "href" );
			if ( wDOI === undefined ) {
				wDOI = $( 'a[id="ddDoi"]' ).attr( "href" );
			}
			try { wDOI = wDOI.split( "https://doi.org/" )[1]; }
			catch( e ) { resolve( "fail" ); return; }
			
			console.log( "\t--> " + wDOI );
			resolve( wDOI );
		}
		catch( error ) { console.log( error ); resolve( "fail" ); }
	});
}

function SEARCH_SINGLE_SCIENCE_DIRECT_ARTICLE_BASIC( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {
			var wBody = await MakeRequest( wURL );
			try { var $ = cheerio.load( wBody ); }
			catch( err ) { resolve( "fail" ); return; }

			var wDOI = $( ".DoiLink" );
			wDOI = $( wDOI ).children();
			wDOI = $( wDOI[ 0 ] ).attr( "href" );
			if ( wDOI === undefined ) {
				wDOI = $( 'a[id="ddDoi"]' ).attr( "href" );
			}
			try { wDOI = wDOI.split( "https://doi.org/" )[1]; }
			catch( e ) {
				wDOI = $( 'input[name="doi"]' ).attr( "value" );
				if ( wDOI === undefined ) {
					var wHTML_Text = $( "body" ).html().toString();
					if ( wHTML_Text ) {
						wHTML_Text = wHTML_Text.split( "\n" );
						for ( var i = 0; i < wHTML_Text.length; ++i ) {
							//console.log( ( i ).toString() + " .) = " + wHTML_Text[ i ] );
							const x1 = wHTML_Text[ i ].substring( 0 , 7 );
							//console.log( ( i ).toString() + " .) = " + x1 );
							if ( x1 === "SDM.doi" ) {
								var x2 = wHTML_Text[ i ].split( " " );
								x2 = x2[ ( x2.length - 1 ) ];
								x2 = x2.split( "'" );
								x2 = x2[ 1 ];
								wDOI = x2;
							}
						}
						if ( wDOI === undefined ) {
							for ( var i = 0; i < wHTML_Text.length; ++i ) {
								console.log( ( i ).toString() + " .) = " + wHTML_Text[ i ] );
								//const x1 = wHTML_Text[ i ].substring( 0 , 7 );
								//console.log( ( i ).toString() + " .) = " + x1 );
								// if ( x1 === "SDM.doi" ) {
								// 	var x2 = wHTML_Text[ i ].split( " " );
								// 	x2 = x2[ ( x2.length - 1 ) ];
								// 	x2 = x2.split( "'" );
								// 	x2 = x2[ 1 ];
								// 	wDOI = x2;
								// }
							}					
							//process.exit(1); 
							await wSleep( 3000 );							
							resolve( "fail" );
							return;
						}
					}				
				}
			}
			
			console.log( "\t--> " + wDOI );
			resolve( wDOI );
		}
		catch( error ) { console.log( error ); resolve( "fail" ); }
	});
}



function PARSE_MAIN_SEARCH_RESULTS( wBody ) {
	try { var $ = cheerio.load( wBody ); }
	catch( err ) { resolve( "fail" ); return; }
	
	var finalResults = [];
	$( ".detail" ).each( function() {

		var wTitle = $( this ).find( ".title" );
		if ( !wTitle ) { return false; }
		wTitle = $( wTitle ).find( "a" );
		if ( !wTitle ) { return false; }
		var wMainLink = $( wTitle ).attr( "href" );
		var wArticleID = wMainLink.split( "/" );
		wArticleID = wArticleID[ ( wArticleID.length - 1 ) ];
		wTitle = $( wTitle ).text();
		if ( !wTitle ) { return false; }
		wTitle = wTitle.trim();
		finalResults.push({
			title: wTitle , 
			doi: null ,
			doiB64: null ,
			mainURL: SCIENCE_DIRECT_ARTICLE_BASE_URL + wMainLink ,
			scihubURL: null ,
			sdAID: wArticleID
		});

	});

	return finalResults;
}

const R_SCIENCE_DIRECT_ARTICLE_HASH = "SCIENCE_DIRECT.ARTICLES";
const R_SCIENCE_DIRECT_ARTICLES = "SCANNERS_SCIENCE_DIRECT.ALREADY_TRACKED";
function FILTER_ALREADY_TRACKED_SD_ARTICLE_IDS( wResults ) {
	return new Promise( async function( resolve , reject ) {
		try {
			var wArticleIDS = wResults.map( x => x[ "sdAID" ] );
			//console.log( wArticleIDS );

			// 1.) Generate Random-Temp Key
			var wTempKey = Math.random().toString(36).substring(7);
			var R_PLACEHOLDER = "SCANNERS." + wTempKey + ".PLACEHOLDER";
			var R_NEW_TRACKING = "SCANNERS." + wTempKey + ".NEW_TRACKING";

			await RU.setSetFromArray( redis , R_PLACEHOLDER , wArticleIDS );
			await RU.setDifferenceStore( redis , R_NEW_TRACKING , R_PLACEHOLDER , R_SCIENCE_DIRECT_ARTICLES );
			await RU.delKey( redis , R_PLACEHOLDER );
			//await RU.setSetFromArray( redis , R_GLOBAL_ALREADY_TRACKED_DOIS , wArticleIDS );

			const wNewTracking = await RU.getFullSet( redis , R_NEW_TRACKING );
			if ( !wNewTracking ) { 
				await RU.delKey( redis , R_NEW_TRACKING ); 
				console.log( "nothing new found" ); 
				PRINT_NOW_TIME(); 
				resolve( [] );
				return;
			}
			if ( wNewTracking.length < 1 ) {
				await RU.delKey( redis , R_NEW_TRACKING );
				console.log( "nothing new found" ); 
				PRINT_NOW_TIME();
				resolve( [] );
				return;
			}
			wResults = wResults.filter( x => wNewTracking.indexOf( x[ "sdAID" ] ) !== -1 );
			await RU.delKey( redis , R_NEW_TRACKING );
			resolve( wResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function PROMISE_ALL_ARTICLE_META_SEARCH( wResults ) {
	return new Promise( function( resolve , reject ) {
		try {
			var wActions = wResults.map( x => ()=> SEARCH_SINGLE_SCIENCE_DIRECT_ARTICLE_BASIC( x ) );
			pALL( wActions , { concurrency: 2 } ).then( result => {
				resolve( result );
			});
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

const SCIENCE_DIRECT_ARTICLE_BASE_URL = "http://www.sciencedirect.com";
const SEARCH_CUSTOM_SD_RSS_FEED_URL = "http://www.sciencedirect.com/science?_ob=ArticleListURL&_method=tag&searchtype=a&refSource=search&_st=4&count=1000&sort=d&filterType=&_chunk=0&hitCount=1351&NEXT_LIST=1&view=c&md5=b22fecb51422c4f3c951c86d8e7d04d9&_ArticleListID=-1247210502&chunkSize=25&sisr_search=&TOTAL_PAGES=55&zone=exportDropDown&citation-type=RIS&format=cite-abs&bottomPaginationBoxChanged=&displayPerPageFlag=t&resultsPerPage=200";
function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "\nScienceDirect.com Scan Started" );
			console.log( "" );
			PrintNowTime();			

			// 1. ) Fetch Latest RSS-Results Matching "autism-keywords"
			var wResults = await MakeRequest( SEARCH_CUSTOM_SD_RSS_FEED_URL );
			wResults = PARSE_MAIN_SEARCH_RESULTS( wResults );

			// 2. A ) See if we have already searched it based in its Science-Direct-Article-ID
			wResults = await FILTER_ALREADY_TRACKED_SD_ARTICLE_IDS( wResults );
			if ( wResults.length < 1 ) { console.log( "\nScienceDirect.com Scan Finished" ); PrintNowTime(); resolve(); return; }

			// 2. B ) Otherwise , Gather 'Meta' info for each Search 'Hit'
			var wMetaURLS = wResults.map( x => x[ "mainURL" ] );
			//wMetaURLS = await map( wMetaURLS , wURL => SEARCH_SINGLE_SCIENCE_DIRECT_ARTICLE_BASIC( wURL ) );
			wMetaURLS = await PROMISE_ALL_ARTICLE_META_SEARCH( wMetaURLS );
			
			for ( var i = 0; i < wResults.length; ++i ) {
				var wDOI = wMetaURLS[ i ];
				if ( wDOI === "fail" ) {
					await wSleep( 1000 );
					browser = await puppeteer.launch({ headless: true , /* slowMo: 2000 */  });
					console.log( "Searching [ " + ( i + 1 ).toString() + " ] of " + wResults.length.toString() );
					wDOI = await SEARCH_SINGLE_SCIENCE_DIRECT_ARTICLE_PUPPETEER( wResults[ i ][ "mainURL" ] );
					await browser.close();
					//await wSleep( 1000 );
				}

				if ( !wDOI ) { wResults[ i ][ "doi" ] = "fail"; continue; }
				if ( wDOI === "fail" ) { continue; }
				if ( wDOI === null ) { wResults[ i ][ "doi" ] = "fail"; continue; }
				if ( wDOI === "null"  ) { wResults[ i ][ "doi" ] = "fail"; continue; }
				if ( wDOI.length < 6 ) { wResults[ i ][ "doi" ] = "fail";  continue; }
				
				wResults[ i ][ "doi" ] = wDOI;
				wResults[ i ][ "doiB64" ] = EncodeB64( wDOI );		
				wResults[ i ][ "scihubURL" ] = SCI_HUB_BASE_URL + wDOI;
				await RU.setAdd( redis , R_SCIENCE_DIRECT_ARTICLES , wResults[ i ][ "sdAID" ] );
				var x1 = JSON.stringify( wResults[ i ] );
				await RU.hashSet( redis , R_SCIENCE_DIRECT_ARTICLE_HASH , wResults[ i ][ "sdAID" ] , x1 );
			}

			console.log( wResults );
			wResults = wResults.filter( x => x[ "doi" ] !== null );
			wResults = wResults.filter( x => x[ "doi" ] !== "fail" );
			console.log( wResults );

			// 3.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 4.) Post Results
			await PostResults( wResults );

			console.log( "\nScienceDirect.com Scan Finished" );
			console.log( "" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;