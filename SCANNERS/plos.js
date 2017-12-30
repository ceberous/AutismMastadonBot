const cheerio = require( "cheerio" );
const { map } = require( "p-iteration" );
const pALL = require( "p-all" );

const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;
const wSleep = require( "../UTILS/genericUtils.js" ).wSleep;
const redis = require( "../UTILS/redisManager.js" ).redisClient;
const RU = require( "../UTILS/redisUtils.js" );

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

// http://collections.plos.org/lockss-manifest
const JOURNAL_NAMES = [ "plosbiology" , "plosclinicaltrials" , "ploscompbiol" , "plosgenetics" , "plosmedicine" , "plosntds" , "plosone" , "plospathogens" ];
const JN_BATCH_1 = [ "plosbiology" , "plosclinicaltrials" , "ploscompbiol" ];
const JN_BATCH_2 = [ "plosgenetics" , "plosmedicine" , "plosntds" , "plospathogens" ];
const JN_BATCH_3 = [ "plosone" ];
const MONTH_NAMES = require( "../CONSTANTS/generic.js" ).MONTH_NAMES;
const BASE_URL_P = "http://journals.plos.org";
const BASE_URL_P1 = "http://journals.plos.org/";
const BASE_URL_P2 = "/lockss-manifest/vol_";
const BASE_URL_P3 = "?cursor=*&pageNumber=0";

const wSearchTerms = ["autism"];
function scanText( wText ) {
	for ( var i = 0; i < wSearchTerms.length; ++i ) {
		var wSTResult = wText.indexOf( wSearchTerms[ i ] );
		if ( wSTResult !== -1 ) {
			return true;
		}
	}	
	return false;
}

function GENERATE_NOW_TIME_URLS( wJournals ) {
	var today1 = new Date();
	var wTY1 = today1.getFullYear();
	var wTM1 = today1.getMonth();
	return wJournals.map( x => {
		return BASE_URL_P1 + x + BASE_URL_P2 + wTY1 + "/" + MONTH_NAMES[ wTM1 ] + BASE_URL_P3;
	});
}

function SEARCH_INDIVIDUAL_PLOS_ARTICLE( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {
			var wBody = await MakeRequest( wURL );
			try { var $ = cheerio.load( wBody ); }
			catch(err) { reject( "cheerio load failed" ); return; }
			var wTitle = $( "#artTitle" ).text();
			var wTitle_Found = false;
			if ( wTitle ) { 
				wTitle = wTitle.trim();
				wTitle_Found = scanText( wTitle );
			}
			var wAbstract_Found = false;
			var wAbstract_Text = $( ".abstract.toc-section" );
			wAbstract_Text = $( wAbstract_Text[0] ).text();

			var xb64 = wURL.split( "id=" )[1];
			xb64 = EncodeB64( xb64 );
			await RU.setAdd( redis , R_PLOS_ARTICLES , xb64 );

			if ( wAbstract_Text ) {
				wAbstract_Text = wAbstract_Text.trim();
				wAbstract_Found = scanText( wAbstract_Text );
			}
			if ( wTitle_Found || wAbstract_Found ) {
				console.log( wTitle );
				console.log( wAbstract_Text );
				resolve( wTitle );
				return;
			}
			else { resolve(); }
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function GET_MONTHS_RESULTS( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {

			var wMonthsResults = await MakeRequest( wURL );
			try { var $ = cheerio.load( wMonthsResults ); }
			catch(err) { reject( "cheerio load failed" ); return; }

			var finalResults = [];
			$( "li" ).each( function() {
				var wA_Tag = $( this ).children()[0];
				var wDOI = $( wA_Tag ).text();
				if ( wDOI ) { wDOI = wDOI.trim(); }
				var wLink = $( wA_Tag ).attr( "href" );
				finalResults.push({
					doi: wDOI ,
					doiB64: EncodeB64( wDOI ) ,
					link: BASE_URL_P + wLink
				});
			});

			resolve( finalResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

const R_PLOS_ARTICLES = "SCANNERS_PLOS.ALREADY_TRACKED";
function FILTER_ALREADY_TRACKED_PLOS_ARTICLE_IDS( wResults ) {
	return new Promise( async function( resolve , reject ) {
		try {
			const wInitial_Length = wResults.length;
			var wArticleIDS_B64 = wResults.map( x => x[ "doiB64" ] );
			//console.log( wArticleIDS_B64 );

			// 1.) Generate Random-Temp Key
			var wTempKey = Math.random().toString(36).substring(7);
			var R_PLACEHOLDER = "SCANNERS." + wTempKey + ".PLACEHOLDER";
			var R_NEW_TRACKING = "SCANNERS." + wTempKey + ".NEW_TRACKING";

			await RU.setSetFromArray( redis , R_PLACEHOLDER , wArticleIDS_B64 );
			await RU.setDifferenceStore( redis , R_NEW_TRACKING , R_PLACEHOLDER , R_PLOS_ARTICLES );
			await RU.delKey( redis , R_PLACEHOLDER );
			//await RU.setSetFromArray( redis , R_PLOS_ARTICLES , wArticleIDS_B64 );

			const wNewTracking = await RU.getFullSet( redis , R_NEW_TRACKING );
			//console.log( wNewTracking );
			if ( !wNewTracking ) { 
				await RU.delKey( redis , R_NEW_TRACKING ); 
				console.log( "nothing new found - Filtered - " + wInitial_Length.toString() ); 
				PrintNowTime(); 
				resolve( [] );
				return;
			}
			if ( wNewTracking.length < 1 ) {
				await RU.delKey( redis , R_NEW_TRACKING );
				console.log( "nothing new found - Filtered - " + wInitial_Length.toString() );
				PrintNowTime();
				resolve( [] );
				return;
			}
			
			wResults = wResults.filter( x => wNewTracking.indexOf( x[ "doiB64" ] ) !== -1 );
			await RU.delKey( redis , R_NEW_TRACKING );
			const wFinal_Length = wResults.length;
			console.log( "Filtered - " + ( wInitial_Length - wFinal_Length ).toString() + " Results" );
			resolve( wResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function PROMISE_ALL_ARTICLE_META_SEARCH( wResults ) {
	return new Promise( function( resolve , reject ) {
		try {
			var wActions = wResults.map( x => async () => { var x1 = await SEARCH_INDIVIDUAL_PLOS_ARTICLE( x ); return x1; } );
			pALL( wActions , { concurrency: 5 } ).then( result => {
				resolve( result );
			});
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function SEARCH( wJournals ) {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "" );
			console.log( "PLOS.org Scan Started" );
			PrintNowTime();	
			
			// 1.) Get This Month's Raw Results
			wJournals = wJournals || JOURNAL_NAMES;
			var wURLS = GENERATE_NOW_TIME_URLS( wJournals );
			console.log( wURLS );
			var wResults = await map( wURLS , wURL => GET_MONTHS_RESULTS( wURL ) );
			wResults = [].concat.apply( [] , wResults );
			//console.log( wResults );

			// 2.) Check Against Already 'Tracked' PLOS-Article-IDS
			wResults = await FILTER_ALREADY_TRACKED_PLOS_ARTICLE_IDS( wResults );
			if ( wResults.length < 1 ) { console.log( "\nPlos.org Scan Finished" ); PrintNowTime(); resolve(); return; }

			// 3.) Enumerate Results , searching for "autism"
			var wLinks = wResults.map( x => x["link"] );
			console.log("");
			console.log( "\nSearching --> " + wLinks.length.toString() + " Articles" );
			//var wDetails = await map( wLinks , wLink => SEARCH_INDIVIDUAL_PLOS_ARTICLE( wLink ) );
			var wDetails = await PROMISE_ALL_ARTICLE_META_SEARCH( wLinks );
			var wFinal_Found_Results = [];
			for ( var i = 0; i < wResults.length; ++i ) {
				if ( wDetails[ i ] !== undefined ) {
					wFinal_Found_Results.push({
						title: wDetails[ i ] ,
						doi: wResults[ i ][ "doi" ] ,
						doiB64: EncodeB64( wResults[ i ][ "doiB64" ] ) ,
						mainURL: wResults[ i ][ "link" ] ,
						scihubURL: SCI_HUB_BASE_URL + wResults[ i ][ "doi" ]
					});
				}
			}
			// 4.) Cache Already Searched Results , so we don't have to search again
			var wFinal_PLOS_DOI_B64S = wResults.map( x => x[ "doiB64" ] );
			await RU.setSetFromArray( redis , R_PLOS_ARTICLES , wFinal_PLOS_DOI_B64S );
			//console.log( wFinal_Found_Results );

			// 5.) Compare to Already 'Tracked' DOIs and Store Uneq
			wFinal_Found_Results = await FilterUNEQResultsREDIS( wFinal_Found_Results );

			// 6.) Post Results
			await PostResults( wFinal_Found_Results );

			console.log( "" );
			console.log( "PLOS.org Scan Finished" );
			PrintNowTime();			
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;

function SLOW_SEARCH( wOptions ) {
	return new Promise( async function( resolve , reject ) {
		try {
			
			await SEARCH( JN_BATCH_1 );
			console.log( "done with batch 1" );
			await wSleep( 5000 );
			await SEARCH( JN_BATCH_2 );
			console.log( "done with batch 2" );
			await wSleep( 5000 );
			await SEARCH( JN_BATCH_3 );
			console.log( "done with batch 3" );

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SLOW_SEARCH;