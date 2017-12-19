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
	console.log( "RedisManager Ready" );
	await require( "./UTILS/mastadonManager.js" ).initialize();
	console.log( "MastadonManager Ready" );

	// Once Per Day Scanners
	JOB_IDS.push({ // large
		name: "PLOS_ORG" ,
		pid: schedule.scheduleJob( { hour: 0 , minute: 5 } , async function() {
			await require( "./SCANNERS/plos.js" ).search();
		}
	)});
	JOB_IDS.push({ 
		name: "CELL_COM" ,
		pid: schedule.scheduleJob( { hour: 0 , minute: 10 } , async function() {
			await require( "./SCANNERS/cell.js" ).search( "month" );
		}
	)});


	// Twice Per Day Scannners
	JOB_IDS.push({ 
		name: "SCIENCE_DIRECT" ,
		pid: schedule.scheduleJob( "10 6,12 * * *" , async function() {
			await require( "./SCANNERS/scienceDirect.js" ).search();
		}
	)});
	JOB_IDS.push({ 
		name: "JMIR_COM" ,
		pid: schedule.scheduleJob( "15 6,12 * * *" , async function() {
			await require( "./SCANNERS/jmir.js" ).search();
		}
	)});


	// Hourly accept hour 0 , because of space for daily
	JOB_IDS.push({ 
		name: "PUB_MED_HOURLY" ,
		pid: schedule.scheduleJob( "1 1-23 * * *" , async function() {
			await require( "./SCANNERS/pubmed.js" ).search( [ "autism" , "autistic" ] );
		}
	)});
	JOB_IDS.push({
		name: "SUBREDDIT_NEW" ,
		pid: schedule.scheduleJob( "05 1-23 * * *" , async function() {
			await require( "./SCANNERS/subreddit.js" ).search( [ "science" , "new" , [ "autis" ] ] );
		}
	)});

	JOB_IDS.push({
		name: "SUBREDDIT_TOP" ,
		pid: schedule.scheduleJob( "10 1-23 * * *" , async function() {
			await require( "./SCANNERS/subreddit.js" ).search( [ "science" , "top" , [ "autis" ] ] );
		}
	)});

	JOB_IDS.push({ 
		name: "NATURE_HOURLY" ,
		pid: schedule.scheduleJob( "15 1-23 * * *" , async function() {
			await require( "./SCANNERS/nature.js" ).search();
		}
	)});

	JOB_IDS.push({ 
		name: "MDPI_COM" ,
		pid: schedule.scheduleJob( "20 1-23 * * *" , async function() {
			await require( "./SCANNERS/mdpi.js" ).search();
		}
	)});

	JOB_IDS.push({ 
		name: "WILEY_COM" ,
		pid: schedule.scheduleJob( "25 */1 * * *" , async function() {
			await require( "./SCANNERS/wiley.js" ).search();
		}
	)});

	JOB_IDS.push({ 
		name: "OXFORD_ACADEMIC" ,
		pid: schedule.scheduleJob( "30 */1 * * *" , async function() {
			await require( "./SCANNERS/oup.js" ).search();
		}
	)});

	JOB_IDS.push({ // fast-xml-feed
		name: "SPECTRUM_NEWS" ,
		pid: schedule.scheduleJob( "35 */1 * * *" , async function() {
			await require( "./SCANNERS/spectrumNews.js" ).search();
		}
	)});

	JOB_IDS.push({ // fast-xml-feed
		name: "SPRINGER_COM" ,
		pid: schedule.scheduleJob( "40 */1 * * *" , async function() {
			await require( "./SCANNERS/springer.js" ).search();
		}
	)});

	JOB_IDS.push({ // fast-xml-feed
		name: "KARGER_COM" ,
		pid: schedule.scheduleJob( "45 */1 * * *" , async function() {
			await require( "./SCANNERS/karger.js" ).search();
		}
	)});

	JOB_IDS.push({ // fast-xml-feed
		name: "KARGER_COM" ,
		pid: schedule.scheduleJob( "47 */1 * * *" , async function() {
			await require( "./SCANNERS/frontiersin.js" ).search();
		}
	)});

	JOB_IDS.push({ // fast-xml-feed
		name: "BIORXIV_ORG" ,
		pid: schedule.scheduleJob( "50 */1 * * *" , async function() {
			await require( "./SCANNERS/biorxiv.js" ).search();
		}
	)});
	

	// Odd-Hour-Daily Scanners
	// 1,3,5,7,9,11,13,15,17,19,21,23


})();