const Twitter = require( "twit" );
var creds = tBotConfig = tBot = null;

// http://www.twitter-character-counter.com/
// Total Characters Allowed = 280
// Links = 'n' characters === ??? 30 ???
function INITIALIZE() {
	return new Promise( function( resolve , reject ) {
		try {
			creds = require( "../personal.js" ).TWITTER_CREDS;
			if ( !creds ) { reject( "no twitter creds" ); return; }
			if ( !creds.consumer_key ) { reject( "no consumer_key" ); return; }
			if ( !creds.consumer_secret ) { reject( "no consumer_secret" ); return; }
			if ( !creds.access_key ) { reject( "no access_key" ); return; }
			if ( !creds.access_secret ) { reject( "no access_secret" ); return; }
			tBotConfig = {
				consumer_key: creds.consumer_key,
				consumer_secret: creds.consumer_secret,
				access_token: creds.access_key,
				access_token_secret: creds.access_secret
			};
			tBot = new Twitter( tBotConfig );
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function wSendTweet( wTweet ) {
	return new Promise( async function( resolve , reject ) {
		try {
			tBot.post( 'statuses/update' , { status: wTweet } , function( error , tweet , response ) {
				setTimeout( async function() {
					console.log( "\nTWEET SENT --> " );
					console.log( wTweet );
					resolve( response );
				} , 2000 );
			});
		}
		catch(err) { console.log( "ERROR SENDING TWEET --> " + err); reject(err); }
	});
}

function ENUMERATE_TWEETS( wResults ) {
	return new Promise( async function( resolve , reject ) {
		try {
			if ( !wResults ) { return; }
			if ( wResults.length < 1 ) { return; }
			for ( var i = 0; i < wResults.length; ++i ) {
				await wSendTweet( wResults[ i ] );
			}
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function FORMAT_PAPERS_AND_TWEET( wResults ) {
	return new Promise( async function( resolve , reject ) {
		try {
			if ( !wResults ) { resolve(); return; }
			var wFormattedTweets = [];
			for ( var i = 0; i < wResults.length; ++i ) {
				var wMessage = "#AutismResearchPapers ";
				if ( wResults[i].title.length > 58 ) {
					wMessage = wMessage + wResults[i].title.substring( 0 , 55 );
					wMessage = wMessage + "...";
				}
				else {
					wMessage = wMessage + wResults[i].title.substring( 0 , 58 );
				}
				if ( wResults[i].mainURL ) {
					wMessage = wMessage + " " + wResults[i].mainURL;
				}
				if ( wResults[i].scihubURL ) {
					wMessage = wMessage + " Paper: " + wResults[i].scihubURL;
				}
				wFormattedTweets.push( wMessage );
			}
			console.log( wFormattedTweets );
			//await ENUMERATE_TWEETS( wFormattedTweets );
			resolve();

		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

module.exports.initialize = INITIALIZE;
module.exports.enumerateTweets = ENUMERATE_TWEETS;
module.exports.formatPapersAndTweet = FORMAT_PAPERS_AND_TWEET;