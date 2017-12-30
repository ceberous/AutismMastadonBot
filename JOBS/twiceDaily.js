module.exports.scan = function() {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "TWICE_DAYLIES_SCANS STARTED" );
			require( "../UTILS/genericUtils.js" ).printNowTime();
			try{ await require( "../SCANNERS/jmir.js" ).search(); }
			catch( e ) { console.log( e ); }
			console.log( "TWICE_DAYLIES_SCANS FINISHED" );
			require( "../UTILS/genericUtils.js" ).printNowTime();
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
};