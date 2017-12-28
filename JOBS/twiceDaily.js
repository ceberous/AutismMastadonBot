module.exports.scan = function() {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "TWICE_DAYLIES_SCANS STARTED" );
			require( "../UTILS/genericUtils.js" ).printNowTime();
			try{ await require( "../SCANNERS/scienceDirect.js" ).search();  }
			catch( e ) { console.log( e ); require( "../UTILS/mastadonManager.js" ).postSlackError( e ); }
			try{ await require( "../SCANNERS/jmir.js" ).search(); }
			catch( e ) { console.log( e ); require( "../UTILS/mastadonManager.js" ).postSlackError( e ); }
			console.log( "TWICE_DAYLIES_SCANS FINISHED" );
			require( "../UTILS/genericUtils.js" ).printNowTime();
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
};