// https://github.com/jhayley/node-mastodon
const Masto = require( "mastodon" );
const slackClient = require( "./slackManager.js" );
slackClient.initialize();
var wMastadonClient = null;
require("shelljs/global");
const wSleep = require( "./genericUtils.js" ).wSleep;

process.on( "unhandledRejection" , function( reason , p ) {
	var xPrps = Object.keys( reason );
	console.log( xPrps );
	console.error( reason, "Unhandled Rejection at Promise" , p );
	console.trace();
	POST_SLACK_ERROR( reason );
});
process.on( "uncaughtException" , function( err ) {
	console.error( err , "Uncaught Exception thrown" );
	console.trace();
	POST_SLACK_ERROR( err );
});

// function fetchHomeTimeline() {
// 	return new Promise( function( resolve , reject ) {
// 		try {
// 			wMastadonClient.get( "timelines/home" , {} ).then( resp => resolve( resp.data ) );
// 		}
// 		catch( error ) { console.log( error ); reject( error ); }
// 	});
// }

function POST_SLACK_ERROR( wStatus ) {
	return new Promise( async function( resolve , reject ) {
		try {
			if ( typeof wStatus !== "string" ) {
				try { wStatus = wStatus.toString(); }
				catch( e ) { wStatus = e; }
			}
			await slackClient.post( wStatus , "#amb-err" );
			if ( wStatus === "Error: Page crashed!" ) {
				await slackClient.post( "Trying to Kill Chrome" , "#amb-err" );
				exec( "pkill -9 chrome" , { silent: true ,  async: false } );
				await wSleep( 1000 );
			}	
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.postSlackError = POST_SLACK_ERROR;

function POST_STATUS( wStatus ) {
	return new Promise( async function( resolve , reject ) {
		try {
			await wMastadonClient.post( "statuses" , { status: wStatus });
			setTimeout( function() {	
				resolve();
			} , 2000 );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.postStatus = POST_STATUS;

function ENUMERATE_STATUS_POSTS( wResults ) {
	return new Promise( async function( resolve , reject ) {
		try {
			if ( !wResults ) { resolve(); return; }
			if ( wResults.length < 1 ) { resolve(); return; }
			for ( var i = 0; i < wResults.length; ++i ) {
				await POST_STATUS( wResults[ i ] );
				await slackClient.post( wResults[ i ] , "#autism" );
			}
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.emumerateStatusPosts = ENUMERATE_STATUS_POSTS;

function FORMAT_PAPERS_AND_POST( wResults ) {
	return new Promise( async function( resolve , reject ) {
		try {
			
			if ( !wResults ) { resolve(); return; }
			var wFormattedStatuses = [];
			for ( var i = 0; i < wResults.length; ++i ) {
				
				var wTotal = 498;
				var wMessage = undefined;
				if ( wResults[i].scihubURL ) {
					wMessage = "#AutismResearchPapers ";
				}
				else { wMessage = "#AutismResearch "; }
				var wAvailable = ( wTotal - wMessage.length );
				// plus 1 for offset of " "
				if ( wResults[i].mainURL ) { wAvailable = ( wAvailable - ( 23 + 1 ) ); }
				// plus 8 for offset of " Paper: "
				if ( wResults[i].scihubURL ) { wAvailable = ( wAvailable - ( 23 + 8 ) ); }
				
				if ( wResults[i].title.length > wAvailable ) {
					wMessage = wMessage + wResults[i].title.substring( 0 , ( wAvailable - 3 ) );
					wMessage = wMessage + "...";
				}
				else {
					wMessage = wMessage + wResults[i].title.substring( 0 , wAvailable );
				}
				if ( wResults[i].mainURL ) {
					wMessage = wMessage + " " + wResults[i].mainURL;
				}
				if ( wResults[i].scihubURL ) {
					wMessage = wMessage + " Paper: " + wResults[i].scihubURL;
				}
				wFormattedStatuses.push( wMessage );
			}
			console.log( wFormattedStatuses );
			await ENUMERATE_STATUS_POSTS( wFormattedStatuses );
			resolve();

		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.formatPapersAndPost = FORMAT_PAPERS_AND_POST;


function INITIALIZE() {
	return new Promise( function( resolve , reject ) {
		try {
			creds = require( "../personal.js" ).MASTADON_CREDS;
			if ( !creds ) { reject( "no mastadon creds" ); return; }
			if ( !creds.access_token ) { reject( "no access token" ); return; }
			if ( !creds.api_url ) { reject( "no api url" ); return; }
			wMastadonClient = new Masto({
				access_token: creds.access_token ,
				timeout_ms: ( 60 * 1000 ) ,
				api_url: creds.api_url
			});
			console.log( "Mastadon Client Ready" );
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.initialize = INITIALIZE;
