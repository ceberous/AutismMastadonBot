function W_SLEEP( ms ) { return new Promise( resolve => setTimeout( resolve , ms ) ); }
module.exports.wSleep = W_SLEEP;

function PRINT_NOW_TIME() {
	var today = new Date();
	var wTY = today.getFullYear();
	var wTM = ( today.getMonth() + 1 );
	var wTD = today.getDate();
	var wTH = today.getHours();
	var wTM = today.getMinutes();
	console.log(  wTY + "-" + wTM + "-" + wTD + " === " + wTH + ":" + wTM + "\n" );
}


module.exports.printNowTime = PRINT_NOW_TIME;

module.exports.encodeBase64 = function( wString ) {
	if ( !wString ) { return "error"; }
	var a1 = new Buffer( wString );
	return a1.toString( "base64" );
};

module.exports.decodeBase64 = function( wString ) {
	var a1 = "";
	try { a1 = new Buffer( wString , "base64" ); }
	catch( e ) { console.log( "error decoding base64" ); console.log( wString ); }
	return a1.toString();
};


const request = require( "request" );

function MAKE_REQUEST( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {
			var finalBody = null;
			function _m_request() {
				return new Promise( function( resolve , reject ) {
					try {
						request( wURL , async function ( err , response , body ) {
							if ( err ) { resolve("error"); return; }
							console.log( wURL + "\n\t--> RESPONSE_CODE = " + response.statusCode.toString() );
							if ( response.statusCode !== 200 ) {
								console.log( "bad status code ... " );
								resolve( "error" );
								return;
							}
							else {
								finalBody = body;
								resolve();
								return;
							}
						});
					}
					catch( error ) { console.log( error ); reject( error ); }
				});
			}

			var wRetry_Count = 3;
			var wSuccess = false;
			while( !wSuccess ) {
				if ( wRetry_Count < 0 ) { wSuccess = true; }
				var xSuccess = await _m_request();
				if ( xSuccess !== "error" ) { wSuccess = true; }
				else {
					wRetry_Count = wRetry_Count - 1;
					await W_SLEEP( 2000 );
					console.log( "retrying" );
				}
			}
			resolve( finalBody );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.makeRequest = MAKE_REQUEST;



function TRY_XML_FEED_REQUEST( wURL ) {
	return new Promise( function( resolve , reject ) {
		try {

			var wResults = [];
			var feedparser = new FeedParser( [{ "normalize": true , "feedurl": wURL }] );
			feedparser.on( "error" , function( error ) { console.log( error ); reject( error ); } );
			feedparser.on( "readable" , function () {
				var stream = this; 
				var item;
				while ( item = stream.read() ) { wResults.push( item ); }
			});

			feedparser.on( "end" , function() {
				resolve( wResults );
			});

			var wReq = request( wURL );
			wReq.on( "error" , function( error ) { console.log( error ); resolve( error ); });
			wReq.on( "response" , function( res ){
				var stream = this;
				if ( res.statusCode !== 200) { console.log( "bad status code" ); resolve("null"); return; }
				else { stream.pipe( feedparser ); }
			});

		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
const FeedParser = require( "feedparser" );
function FETCH_XML_FEED( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "Searching --> " + wURL );
			var wResults = [];

			var RETRY_COUNT = 3;
			var SUCCESS = false;

			while ( !SUCCESS ) {
				if ( RETRY_COUNT < 0 ) { SUCCESS = true; }
				wResults = await TRY_XML_FEED_REQUEST( wURL );
				if ( wResults !== "null" ) { SUCCESS = true; }
				else { 
					console.log( "retrying again" );
					RETRY_COUNT = RETRY_COUNT - 1;
					await wSleep( 2000 );
				}
			}
			resolve( wResults );

		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.fetchXMLFeed = FETCH_XML_FEED;


const redis = require( "../UTILS/redisManager.js" ).redis;
const RU = require( "../UTILS/redisUtils.js" );
const R_GLOBAL_ALREADY_TRACKED_DOIS = "SCANNERS.GLOBAL.ALREADY_TRACKED.DOIS";
function RETURN_UNEQ_RESULTS_AND_SAVE_INTO_REDIS( wCommonResults ) {
	return new Promise( async function( resolve , reject ) {
		try {

			// 1.) Generate Random-Temp Key
			var wTempKey = Math.random().toString(36).substring(7);
			var R_PLACEHOLDER = "SCANNERS." + wTempKey + ".PLACEHOLDER";
			var R_NEW_TRACKING = "SCANNERS." + wTempKey + ".NEW_TRACKING";

			// 2.) Compare to Already 'Tracked' DOIs and Store Uneq
			var b64_DOIS = wCommonResults.map( x => x[ "doiB64" ] );
			await RU.setSetFromArray( redis , R_PLACEHOLDER , b64_DOIS );
			await RU.setDifferenceStore( redis , R_NEW_TRACKING , R_PLACEHOLDER , R_GLOBAL_ALREADY_TRACKED_DOIS );
			await RU.delKey( redis , R_PLACEHOLDER );
			await RU.setSetFromArray( redis , R_GLOBAL_ALREADY_TRACKED_DOIS , b64_DOIS );

			// 3.) Retrieve The 'Difference' Set
			const wNewTracking = await RU.getFullSet( redis , R_NEW_TRACKING );
			if ( !wNewTracking ) { 
				await RU.delKey( redis , R_NEW_TRACKING ); 
				// console.log( "nothing new found" ); 
				// PRINT_NOW_TIME(); 
				resolve();
				return;
			}
			if ( wNewTracking.length < 1 ) {
				await RU.delKey( redis , R_NEW_TRACKING );
				// console.log( "nothing new found" ); 
				// PRINT_NOW_TIME();				
				resolve();
				return;
			}

			// 4.) Filter Out Results to Return 'New-Valid' Tweets
			wCommonResults = wCommonResults.filter( x => wNewTracking.indexOf( x[ "doiB64" ] ) !== -1 );
			await RU.delKey( redis , R_NEW_TRACKING );

			resolve( wCommonResults );

		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.filterUneqResultsCOMMON = RETURN_UNEQ_RESULTS_AND_SAVE_INTO_REDIS;