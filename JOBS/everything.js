module.exports.scan = function() {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "Everything Scan STARTED" );
			require( "../UTILS/genericUtils.js" ).printNowTime();
			await require( "./daily.js" ).scan();
			await require( "./twiceDaily.js" ).scan();
			await require( "./everyThreeHours.js" ).scan();
			await require( "./hourly.js" ).scan();
			console.log( "Everything Scan FINISHED" );
			require( "../UTILS/genericUtils.js" ).printNowTime();
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
};