process.on( "unhandledRejection" , function( reason , p ) {
	console.error( reason, "Unhandled Rejection at Promise" , p );
	console.trace();
});
process.on( "uncaughtException" , function( err ) {
	console.error( err , "Uncaught Exception thrown" );
	console.trace();
});


function SCAN_DAYLIES() {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "DAYLIES_SCANS STARTED" );
			PrintNowTime();			
			await require( "./SCANNERS/plos.js" ).search();
			await require( "./SCANNERS/cell.js" ).search( "month" );
			console.log( "DAYLIES_SCANS FINISHED" );
			PrintNowTime();					
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function SCAN_TWICE_DAYLIES() {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "TWICE_DAYLIES_SCANS STARTED" );
			PrintNowTime();
			await require( "./SCANNERS/scienceDirect.js" ).search();
			await require( "./SCANNERS/jmir.js" ).search();
			console.log( "TWICE_DAYLIES_SCANS FINISHED" );
			PrintNowTime();			
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function SCAN_THREE_HOUR() {
	return new Promise( async function( resolve , reject ) {
		try {
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function SCAN_HOURLIES() {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "HOURLY SCAN STARTED" );
			PrintNowTime();
			try{ await require( "./SCANNERS/pubmed.js" ).search( [ "autism" , "autistic" ] ); }
			catch( e ) { console.log( e ); }
			try{ await require( "./SCANNERS/subreddit.js" ).search( [ "science" , "new" , [ "autis" ] ] ); }
			catch( e ) { console.log( e ); }
			try{ await require( "./SCANNERS/subreddit.js" ).search( [ "science" , "top" , [ "autis" ] ] ); }
			catch( e ) { console.log( e ); }
			try{ await require( "./SCANNERS/nature.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "./SCANNERS/mdpi.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "./SCANNERS/wiley.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "./SCANNERS/oup.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "./SCANNERS/spectrumNews.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "./SCANNERS/springer.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "./SCANNERS/karger.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "./SCANNERS/frontiersin.js" ).search(); }
			catch( e ) { console.log( e ); }
			try{ await require( "./SCANNERS/biorxiv.js" ).search(); }
			catch( e ) { console.log( e ); }
			console.log( "HOURLY SCAN FINISHED" );
			PrintNowTime();			
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function SCAN_EVERYTHING() {
	return new Promise( async function( resolve , reject ) {
		try {
			await SCAN_DAYLIES();
			await SCAN_TWICE_DAYLIES();
			await SCAN_THREE_HOUR();
			await SCAN_HOURLIES();
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

var PrintNowTime = null;
const schedule = require( "node-schedule" );
var JOB_IDS = [];

// Init
( async ()=> {

	await require( "./UTILS/redisManager.js" ).initialize();
	PrintNowTime = require( "./UTILS/genericUtils.js" ).printNowTime;
	
	JOB_IDS.push({ 
		name: "DAYLIES" ,
		pid: schedule.scheduleJob( { hour: 0 , minute: 1 } , ()=> { SCAN_EVERYTHING(); } )
	});

	JOB_IDS.push({ 
		name: "TWICE_DAYLIES_SCANS" ,
		pid: schedule.scheduleJob( "40 1,12 * * *" , ()=> { SCAN_TWICE_DAYLIES(); } )
	});

	JOB_IDS.push({ 
		name: "HOURLY_SCANS" ,
		pid: schedule.scheduleJob( "1 1-23 * * *" , ()=> { SCAN_HOURLIES(); } )
	});

})();