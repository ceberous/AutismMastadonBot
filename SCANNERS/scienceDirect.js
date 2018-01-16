require("shelljs/global");
const process = require( "process" );

const cheerio = require( "cheerio" );
const { map } = require( "p-iteration" );
// https://github.com/sindresorhus/promise-fun
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

function TRY_CUSTOM_CHEERIO_STRATEGY( wBody ) {
	try { var $ = cheerio.load( wBody ); }
	catch( err ) { return( "fail" ); }
	var wDOI = $( ".DoiLink" );
	wDOI = $( wDOI ).children();
	wDOI = $( wDOI[ 0 ] ).attr( "href" );
	if ( wDOI === undefined ) {
		//console.log( "Stage = A" );
		wDOI = $( 'a[id="ddDoi"]' ).attr( "href" );
	}
	// B.)
	if ( wDOI === undefined ) {
		//console.log( "Stage = B" );
		wDOI = $( ".doi" ).find( "a" );
		if ( wDOI ) { wDOI = $( wDOI[ 0 ] ).attr( "href" ) };
	}
	// C.)
	if ( wDOI === undefined ) {
		//console.log( "Stage = C" );
		wDOI = $( 'a[class="S_C_ddDoi"]' ).attr( "href" );
	}
	// D.)
	if ( wDOI === undefined ) {
		//console.log( "Stage = D" );
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
					if ( wDOI === "1" || wDOI === 1 ) { console.log( "\nREJECTION -- \n" +  wHTML_Text[ i ] ); wDOI = "fail"; }
				}
			}
		}
	}
	if ( wDOI === undefined ) { wDOI = "fail"; }
	else {
		if ( wDOI.indexOf( "doi.org" ) !== -1 ) {
			try { wDOI = wDOI.split( "doi.org/" )[ 1 ]; }
			catch( e ) { wDOI = "fail"; }
		}
	}
	return wDOI;
}

var browser = null;
function SEARCH_SINGLE_SCIENCE_DIRECT_ARTICLE_PUPPETEER( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( wURL );
			const page = await browser.newPage();
			await page.setViewport( { width: 1200 , height: 700 } );
			//await page.setJavaScriptEnabled( false );
			await page.goto( wURL , { /* timeout: ( 15 * 1000 ) ,*/ waitUntil: "networkidle0" } );
			await page.waitFor( 6000 );
			var xPageDOI = await page.evaluate( () => {
				if ( window.SDM ) {
					if ( window.SDM.pm ) { if ( window.SDM.pm.doi ) { return Promise.resolve( window.SDM.pm.doi ); } }
					else if ( window.SDM.doi ) { return Promise.resolve( window.SDM.doi ); }
					else { return Promise.resolve( undefined ); }
				}
			});
			if ( xPageDOI !== undefined ) { console.log( "\t--> " + xPageDOI ); resolve( xPageDOI ); return; }
			
			var wBody = await page.content();
			var wDOI = TRY_CUSTOM_CHEERIO_STRATEGY( wBody );
			console.log( "\t--> " + wDOI );
			resolve( wDOI );
		}
		catch( error ) { console.log( error ); resolve( "fail" ); }
	});
}


function SEARCH_SINGLE_SCIENCE_DIRECT_ARTICLE_BASIC( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {
			// 1.) Grab Body
			var wBody = await MakeRequest( wURL );
			if ( !wBody ) { console.log( "\t--> HTTP fail" ); resolve( "fail" ); retun; }
			
			// 2.) Try Various Methods of 'Finding' the DOI
			var wDOI = TRY_CUSTOM_CHEERIO_STRATEGY( wBody );
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
			var wActions = wResults.map( x => async () => { var x1 = await SEARCH_SINGLE_SCIENCE_DIRECT_ARTICLE_BASIC( x ); await wSleep( 1000 ); return x1; } );
			pALL( wActions , { concurrency: 5 } ).then( result => {
				resolve( result );
			});
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function RUN_CUSTOM_META_SEARCH( wResults ) {
	return new Promise( async function( resolve , reject ) {
		try {
			var wMetaURLS = wResults.map( x => x[ "mainURL" ] );
			//wMetaURLS = await map( wMetaURLS , wURL => SEARCH_SINGLE_SCIENCE_DIRECT_ARTICLE_BASIC( wURL ) );
			wMetaURLS = await PROMISE_ALL_ARTICLE_META_SEARCH( wMetaURLS );
			console.log( wMetaURLS.length.toString() + " === " + wResults.length.toString() );
			for ( var i = 0; i < wResults.length; ++i ) {
				var wDOI = wMetaURLS[ i ];
				if ( !wDOI ) { wResults[ i ][ "doi" ] = "fail"; continue; }
				if ( wDOI === "fail" ) { wResults[ i ][ "doi" ] = "fail"; continue; }
				if ( wDOI === null ) { wResults[ i ][ "doi" ] = "fail"; continue; }
				if ( wDOI === "null"  ) { wResults[ i ][ "doi" ] = "fail"; continue; }
				if ( wDOI.length < 6 ) { wResults[ i ][ "doi" ] = "fail";  continue; }
				wResults[ i ][ "doi" ] = wDOI;
				wResults[ i ][ "doiB64" ] = EncodeB64( wDOI );		
				wResults[ i ][ "scihubURL" ] = SCI_HUB_BASE_URL + wDOI;
			}
			resolve( wResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

const SCIENCE_DIRECT_ARTICLE_BASE_URL = "http://www.sciencedirect.com";
const SEARCH_CUSTOM_SD_RSS_FEED_URL_1 = "http://www.sciencedirect.com/science?_ob=ArticleListURL&_method=tag&searchtype=a&refSource=search&_st=4&count=1000&sort=d&filterType=&_chunk=0&hitCount=1351&NEXT_LIST=1&view=c&md5=b22fecb51422c4f3c951c86d8e7d04d9&_ArticleListID=-1247210502&chunkSize=25&sisr_search=&TOTAL_PAGES=55&zone=exportDropDown&citation-type=RIS&format=cite-abs&bottomPaginationBoxChanged=&displayPerPageFlag=t&resultsPerPage=200";
const SEARCH_CUSTOM_SD_RSS_FEED_URL_2 = "http://www.sciencedirect.com/science?_ob=ArticleListURL&_method=tag&sort=d&sisrterm=&_ArticleListID=-1248608185&view=c&_chunk=0&count=151&_st=&refsource=&md5=309e47b6ba1c91cf55d6e2c805fa6939&searchtype=a&originPage=rslt_list&filterType=";
function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "\nScienceDirect.com Scan Started" );
			console.log( "" );
			PrintNowTime();			

			// 1. ) Fetch Latest RSS-Results Matching "autism-keywords"
			var wResults = await MakeRequest( SEARCH_CUSTOM_SD_RSS_FEED_URL_1 );
			wResults = PARSE_MAIN_SEARCH_RESULTS( wResults );

			// 2. ) See if we have already searched it based in its Science-Direct-Article-ID
			wResults = await FILTER_ALREADY_TRACKED_SD_ARTICLE_IDS( wResults );
			if ( wResults.length < 1 ) { console.log( "\nScienceDirect.com Scan Finished" ); PrintNowTime(); resolve(); return; }

			// 3. ) Otherwise , Gather 'Meta' info for each Search 'Hit'
			wResults = await RUN_CUSTOM_META_SEARCH( wResults );
			var wFailed = wResults.filter( x => x[ "doi" ] === "fail" );
			wResults = wResults.filter( x => x[ "doi" ] !== "fail" );
			/*
			// Rerun Failed Results again Just in Case
			if ( wFailed.length > 0 ) {
				var wFailed2 = await RUN_CUSTOM_META_SEARCH( wFailed );
				wFailed2 = wFailed2.filter( x => x[ "doi" ] === "fail" );
				var xNewResults = wFailed2.filter( x => x[ "doi" ] !== "fail" );
				for ( var i = 0; i < xNewResults.length; ++i ) { wResults.push( xNewResults[ i ] ); }
				console.log( wResults );
			}
			*/
			
			//4.) If there are still failures , try with puppeteer
			for ( var i = 0; i < wFailed.length; ++i ) {
				await wSleep( 1000 );
				browser = await puppeteer.launch({ headless: true , /* slowMo: 2000 */  });
				console.log( "Searching [ " + ( i + 1 ).toString() + " ] of " + wFailed.length.toString() );
				wDOI = await SEARCH_SINGLE_SCIENCE_DIRECT_ARTICLE_PUPPETEER( wFailed[ i ][ "mainURL" ] );
				await browser.close();
				if ( wDOI ) {
					if ( wDOI !== "fail" && wDOI.length > 6 ) {
						wFailed[ i ][ "doi" ] = wDOI;
						wFailed[ i ][ "doiB64" ] = EncodeB64( wDOI );
						wFailed[ i ][ "scihubURL" ] = SCI_HUB_BASE_URL + wDOI
					}
				}
			}
			var wNewResults = wFailed.filter( x => x[ "doi" ] !== "fail" );
			for ( var i = 0; i < wNewResults.length; ++i ) { wResults.push( wNewResults[ i ] ); }

			// 5. ) Store List of Already 'Tracked' SD Articles Into Redis
			const wFinalSDA_IDS = wResults.map( x => x[ "sdAID" ] );
			await RU.setSetFromArray( redis , R_SCIENCE_DIRECT_ARTICLES , wFinalSDA_IDS );

			// 6.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 7.) Post Results
			await PostResults( wResults );

			exec( "pkill -9 chrome" , { silent: true ,  async: false } );
			
			console.log( "\nScienceDirect.com Scan Finished" );
			console.log( "" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;