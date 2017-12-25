module.exports.scan = function() {
	return new Promise( async function( resolve , reject ) {
		try {
			// console.log( "Every Three Hour Scan STARTED" );
			// require( "../UTILS/genericUtils.js" ).printNowTime();
			// console.log( "Every Three Hour Scan FINISHED" );
			// require( "../UTILS/genericUtils.js" ).printNowTime();
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
};