module.exports.scan = function() {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "DAYLIES_SCANS STARTED" );
			require( "../UTILS/genericUtils.js" ).printNowTime();
			try{ await require( "../SCANNERS/plos.js" ).search();  }
			catch( e ) { console.log( e ); }
			try{ await require( "../SCANNERS/cell.js" ).search( "month" ); }
			catch( e ) { console.log( e ); }
			try{ await require( "../SCANNERS/elsevierhealth.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "./SCANNERS/pnas.js" ).search(); }
			catch( e ) { console.log( e ); }
			console.log( "DAYLIES_SCANS FINISHED" );
			require( "../UTILS/genericUtils.js" ).printNowTime();
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
};