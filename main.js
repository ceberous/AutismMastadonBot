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

	//require( "./JOBS/everything.js" ).scan();
	//require( "./JOBS/daily.js" ).scan();
	//require( "./JOBS/twiceDaily.js" ).scan();
	require( "./JOBS/hourly.js" ).scan();

})();
