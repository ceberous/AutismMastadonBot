module.exports.scan = function() {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "HOURLY SCAN STARTED" );
			require( "../UTILS/genericUtils.js" ).printNowTime();
			try{ await require( "../SCANNERS/pubmed.js" ).search( [ "autism" , "autistic" ] ); }
			catch( e ) { console.log( e ); }
			try{ await require( "../SCANNERS/subreddit.js" ).search( [ "science" , "new" , [ "autis" ] ] ); }
			catch( e ) { console.log( e ); }
			try{ await require( "../SCANNERS/subreddit.js" ).search( [ "science" , "top" , [ "autis" ] ] ); }
			catch( e ) { console.log( e ); }
			try{ await require( "../SCANNERS/nature.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "../SCANNERS/mdpi.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "../SCANNERS/wiley.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "../SCANNERS/oup.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "../SCANNERS/spectrumNews.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "../SCANNERS/springer.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "../SCANNERS/karger.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "../SCANNERS/frontiersin.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "../SCANNERS/biorxiv.js" ).search(); }
			catch( e ) { console.log( e ); }
			console.log( "HOURLY SCAN FINISHED" );
			require( "../UTILS/genericUtils.js" ).printNowTime();		
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
};