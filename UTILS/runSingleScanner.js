const process = require( "process" );

const wScannerPathBase = "../SCANNERS/";
( async ()=> {
	await require( "./redisManager.js" ).initialize();
	await require( "./mastadonManager.js" ).initialize();
	var wScannerPath = wScannerPathBase;
	if ( !process.argv[ 2 ] ) {
		wScannerPath = wScannerPath + "pubmed.js";
	}
	else { wScannerPath = wScannerPath + process.argv[ 2 ] + ".js"; }
	console.log( "Running --> " + wScannerPath );
	await require( wScannerPath ).search();
})();