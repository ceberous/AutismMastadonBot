const cheerio = require( "cheerio" );
const { map } = require( "p-iteration" );

const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;
const wSleep = require( "../UTILS/genericUtils.js" ).wSleep;

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
					link: BASE_URL_P + wLink
				});
			});

			resolve( finalResults );
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

			// 2.) Enumerate Results , searching for "autism"
			var wLinks = wResults.map( x => x["link"] );
			console.log("");
			console.log( "\nSearching --> " + wLinks.length.toString() + " Articles" );
			var wDetails = await map( wLinks , wLink => SEARCH_INDIVIDUAL_PLOS_ARTICLE( wLink ) );
			var wFinal_Found_Results = [];
			for ( var i = 0; i < wResults.length; ++i ) {
				if ( wDetails[ i ] !== undefined ) {
					wFinal_Found_Results.push({
						title: wDetails[ i ] ,
						doi: wResults[ i ][ "doi" ] ,
						doiB64: EncodeB64( wResults[ i ][ "doi" ] ) ,
						mainURL: wResults[ i ][ "link" ] ,
						scihubURL: SCI_HUB_BASE_URL + wResults[ i ][ "doi" ]
					});
				}
			}
			//console.log( wFinal_Found_Results );

			// 3.) Compare to Already 'Tracked' DOIs and Store Uneq
			wFinal_Found_Results = await FilterUNEQResultsREDIS( wFinal_Found_Results );

			// 4.) Post Results
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