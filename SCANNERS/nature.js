const cheerio = require( "cheerio" );
const pALL = require( "p-all" );

const redis = require( "../UTILS/redisManager.js" ).redisClient;
const RU = require( "../UTILS/redisUtils.js" );
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

function SEARCH_INDIVIDUAL_NATURE_ARTICLE( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {
			var wBody = await MakeRequest( wURL );
			try { var $ = cheerio.load( wBody ); }
			catch( err ) { return( "fail" ); }
			var wDOI = undefined;
			wDOI = $( 'li[data-test="doi"]' );
			if ( wDOI ) {
				wDOI = $( wDOI ).text();
				if ( wDOI ) { wDOI = wDOI.trim(); }
			}
			if ( wDOI.length < 3 ) {
				var wFound = false;
				$( "abbr" ).each( function() {
					if ( !wFound ) {
						var wText = $( this ).text();
						if ( wText ) { 
							wText = wText.trim(); wText = wText.toLowerCase(); 
							if ( wText === "doi" ) {
								wText = $( this ).parent();
								if ( wText ) {
									wText = $( wText ).text();
									if ( wText ) { wDOI = wText; wFound = true; }
								}
							}
						}
					}
				});
			}
			if ( wDOI ) {
				if ( wDOI.length > 3 ) {
					if ( wDOI.indexOf( "doi:" ) !== -1 ) {
						wDOI = wDOI.split( "doi:" )[1];
					}
				}
			}
			if ( !wDOI ) { wDOI = "fail"; }
			if ( wDOI ) { if ( wDOI.length < 3 ) { wDOI = "fail"; } }
			console.log( "\t\t--> " + wDOI );
			resolve( wDOI );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function PROMISE_ALL_ARTICLE_META_SEARCH( wResults ) {
	return new Promise( function( resolve , reject ) {
		try {
			var wActions = wResults.map( x => async () => { var x1 = await SEARCH_INDIVIDUAL_NATURE_ARTICLE( x ); return x1; } );
			pALL( wActions , { concurrency: 5 } ).then( result => {
				resolve( result );
			});
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

const R_NATURE_ARTICLES = "SCANNERS_NATURE.ALREADY_TRACKED";
function FILTER_ALREADY_TRACKED_NATURE_ARTICLE_IDS( wResults ) {
	return new Promise( async function( resolve , reject ) {
		try {
			var wArticleIDS_B64 = wResults.map( x => x[ "nAIDB64" ] );
			//console.log( wArticleIDS_B64 );

			// 1.) Generate Random-Temp Key
			var wTempKey = Math.random().toString(36).substring(7);
			var R_PLACEHOLDER = "SCANNERS." + wTempKey + ".PLACEHOLDER";
			var R_NEW_TRACKING = "SCANNERS." + wTempKey + ".NEW_TRACKING";

			await RU.setSetFromArray( redis , R_PLACEHOLDER , wArticleIDS_B64 );
			await RU.setDifferenceStore( redis , R_NEW_TRACKING , R_PLACEHOLDER , R_NATURE_ARTICLES );
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
			wResults = wResults.filter( x => wNewTracking.indexOf( x[ "nAIDB64" ] ) !== -1 );
			await RU.delKey( redis , R_NEW_TRACKING );
			resolve( wResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function PARSE_NATURE_SEARCH_PAGE( wBody ) {
	try { var $ = cheerio.load( wBody ); }
	catch( err ) { return( "fail" ); }
	var finalResults = [];
	$( 'li[itemtype="http://schema.org/Article"]' ).each( function() {
		var wTitle = $( this ).find( "h2" );
		var wLink = undefined;
		if ( wTitle ) {
			wTitle = $( wTitle[0] ).find( "a" );
		}
		if ( wTitle ) {
			wLink = $( wTitle[0] ).attr( "href" );
			wTitle = $( wTitle[0] ).text();
		}
		if ( wTitle ) {
			wTitle = wTitle.trim();
		}
		if ( wTitle.length > 3 ) {
			var wOBJ = { title: wTitle , mainURL: wLink };
			if ( wLink ) {
				var wNatureArticleID = wLink.split( "/" );
				wNatureArticleID = wNatureArticleID.pop();
				wOBJ[ "nAID" ] = wNatureArticleID;
				wOBJ[ "nAIDB64" ] = EncodeB64( wNatureArticleID );
			}
			finalResults.push( wOBJ );
		}
	});
	return finalResults;
}

const NATURE_SEARCH_URL = "https://www.nature.com/search?order=date_desc&q=autism&title=autism&page=1";
//const NATURE_SEARCH_URL_P2 = "https://www.nature.com/search?order=date_desc&q=autism&title=autism&page=2";
function SEARCH() {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "\nNature.com Scan Started" );
			console.log( "" );
			PrintNowTime();

			// 1.) Search Page
			var wResults = await MakeRequest( NATURE_SEARCH_URL );
			wResults = PARSE_NATURE_SEARCH_PAGE( wResults );
			console.log( wResults );

			// 2. ) See if we have already searched it based in its Science-Direct-Article-ID
			wResults = await FILTER_ALREADY_TRACKED_NATURE_ARTICLE_IDS( wResults );
			if ( wResults.length < 1 ) { console.log( "\nNature.com Scan Finished , Nothing New" ); PrintNowTime(); resolve(); return; }

			// 3. ) Lookup DOI for each Article Then
			const wMainURLS = wResults.map( x => x[ "mainURL" ] );
			const wMetaStuff = await PROMISE_ALL_ARTICLE_META_SEARCH( wMainURLS );
			for ( var i = 0; i < wResults.length; ++i ) {
				if ( wMetaStuff[ i ] !== "fail" ) {
					wResults[ i ][ "doi" ] = wMetaStuff[ i ];
					wResults[ i ][ "doiB64" ] = EncodeB64( wMetaStuff[ i ] );
					wResults[ i ][ "scihubURL" ] = SCI_HUB_BASE_URL + wMetaStuff[ i ];
					await RU.setAdd( redis , R_NATURE_ARTICLES , wResults[ i ][ "nAIDB64" ] );
				}
			}
			console.log( wResults );

			// 4.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 5.) Post Results
			await PostResults( wResults );

			console.log( "\nNature.com Scan Finished" );
			console.log( "" );
			PrintNowTime();
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;