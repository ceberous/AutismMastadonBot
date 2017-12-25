process.on( "unhandledRejection" , function( reason , p ) {
	console.error( reason, "Unhandled Rejection at Promise" , p );
	console.trace();
});
process.on( "uncaughtException" , function( err ) {
	console.error( err , "Uncaught Exception thrown" );
	console.trace();
});


const schedule = require( "node-schedule" );
var JOB_IDS = [];

( async ()=> {

	await require( "./UTILS/redisManager.js" ).initialize();
	await require( "./UTILS/mastadonManager.js" ).initialize();

	JOB_IDS.push({ 
		name: "DAYLIES" ,
		pid: schedule.scheduleJob( { hour: 0 , minute: 1 } , ()=> { require( "./JOBS/everything.js" ).scan(); } )
	});

	JOB_IDS.push({ 
		name: "TWICE_DAYLIES_SCANS" ,
		pid: schedule.scheduleJob( "40 1,12 * * *" , ()=> { require( "./JOBS/twiceDaily.js" ).scan(); } )
	});

	JOB_IDS.push({ 
		name: "HOURLY_SCANS" ,
		pid: schedule.scheduleJob( "1 1-23 * * *" , ()=> { require( "./JOBS/hourly.js" ).scan(); } )
	});

})();