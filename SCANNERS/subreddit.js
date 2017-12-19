const FetchXMLFeed = require( "../UTILS/genericUtils.js" ).fetchXMLFeed;
const { map } = require( "p-iteration" );
const PostResults = require( "../UTILS/mastadonManager.js" ).emumerateStatusPosts;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const redis = require( "../UTILS/redisManager.js" ).redis;
const RU = require( "../UTILS/redisUtils.js" );

function wSleep( ms ) { return new Promise( resolve => setTimeout( resolve , ms ) ); }

var wSearchTerms = [];
var wFinalPosts = [];

function scanText( wText ) {
	
	for ( var i = 0; i < wSearchTerms.length; ++i ) {
		var wSTResult = wText.indexOf( wSearchTerms[ i ] );
		if ( wSTResult !== -1 ) {
			return true;
		}
	}
	
	return false;
}

function SEARCH_SINGLE_THREAD( wComments ) {
	return new Promise( function( resolve , reject ) {
		try {
			var wFR = [];
			var x1 = wComments["atom:content"]["#"].toLowerCase();
			var wFoundKeyword = scanText( x1 );
			if ( wFoundKeyword ) {			
				var wtemp = wComments.link.split("/");
				if ( wtemp.length === 10 ) {
					//console.log( "KEYWORD MATCH GAURENTEED FOUND !!!!" );
					//console.log( wComments.link )
					var wID = wtemp[ wtemp.length - 4 ] + "-" + wtemp[ wtemp.length - 2 ];
					wFR.push({
						id: wID ,
						link: wComments.link
					});
				}
			}
			resolve( wFR );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

const R_SUBREDDIT_PLACEHOLDER = "SCANNERS.SUBREDDIT.PLACEHOLDER";
const R_PUBMED_NEW_TRACKING = "SCANNERS.SUBREDDIT.NEW_TRACKING";
const R_GLOBAL_ALREADY_TRACKED = "SCANNERS.SUBREDDIT.ALREADY_TRACKED";
function SEARCH_SUBREDDIT( wOptions ) {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "" );
			console.log( "\nStarted Subbreddit Scan" );
			PrintNowTime();
			
			// 1.) Get 'Top' Level Threads
			wSearchTerms = wOptions[ 2 ];
			var wMainURL = "https://www.reddit.com/r/" + wOptions[ 0 ] + "/" + wOptions[ 1 ] + "/.rss";
			var wTopThreads = await FetchXMLFeed( wMainURL );

			// 2.) Search the Each Title
			var wTopCommentTitles = wTopThreads.map( x => x["atom:title"]["#"].toLowerCase() );
			wTopCommentTitles = wTopCommentTitles.filter( x => scanText( x ) === true );
			wTopCommentTitles =  wTopCommentTitles.map( x => "#AutismComments " + x );
			wFinalPosts = [].concat.apply( [] , wTopCommentTitles );

			// 3.) Get 'Comment' Threads for each 'Top' Thread
			var wTopCommentURLS = wTopThreads.map( x => x["link"] + ".rss" );
			var wTopCommentsThreads = await map( wTopCommentURLS , wURL => FetchXMLFeed( wURL ) );
			wTopCommentsThreads = wTopCommentsThreads.map( function( x ) {
				try{ x.shift(); return x; }  // 1st one is "main" url
				catch( e ) { return []; } // this 'knocks-out' any 'bad/empty' requests
			});
			wTopCommentsThreads = [].concat.apply( [] , wTopCommentsThreads );

			// 4.) Get 'Single' Threads for each 'Comment' Thread
			var wSingleCommentURLS = wTopCommentsThreads.map( x => x["link"] + ".rss" );
			var wSingleThreads = await map( wSingleCommentURLS , wURL => FetchXMLFeed( wURL ) );
			wSingleThreads = [].concat.apply( [] , wSingleThreads );

			console.log( "\nTotal Single Threads to Search === " + wSingleThreads.length.toString() + "\n" );

			// 5.) Finally, Search over All Single Comments
			var wResults = await map( wSingleThreads , wThread => SEARCH_SINGLE_THREAD( wThread ) );
			wResults = [].concat.apply( [] , wResults );

			// 6.) Filter for 'Un-Posted' Results and Store 'Uneq' ones
			var wIDS = wResults.map( x => x["id"] );
			await RU.setSetFromArray( redis , R_SUBREDDIT_PLACEHOLDER , wIDS );
			await RU.setDifferenceStore( redis , R_PUBMED_NEW_TRACKING , R_SUBREDDIT_PLACEHOLDER , R_GLOBAL_ALREADY_TRACKED );
			await RU.delKey( redis , R_SUBREDDIT_PLACEHOLDER );
			const wNewTracking = await RU.getFullSet( redis , R_PUBMED_NEW_TRACKING );
			if ( !wNewTracking ) { console.log( "\nSubreddit-Scan --> nothing new found" ); PrintNowTime(); resolve(); return; }
			if ( wNewTracking.length < 1 ) { console.log( "\nSubreddit-Scan --> nothing new found" ); PrintNowTime(); resolve(); return; }
			wIDS = wIDS.filter( x => wNewTracking.indexOf( x ) !== -1 );
			wResults = wResults.filter( x => wIDS.indexOf( x["id"] ) !== -1 );
			await RU.delKey( redis , R_PUBMED_NEW_TRACKING );
			await RU.setSetFromArray( redis , R_GLOBAL_ALREADY_TRACKED , wIDS );

			// 7.) Post Unique Results
			wResults =  wResults.map( x => "#AutismComments " + x["link"] );
			wFinalPosts = [].concat.apply( [] , wResults );
			console.log( wFinalPosts );
			await PostResults( wFinalPosts );

			wSearchTerms = [];
			wFinalPosts = [];
			console.log( "\nSubbreddit Scan Finished" );
			console.log( "" );
			PrintNowTime();			
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH_SUBREDDIT;