const cheerio = require( "cheerio" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

function PARSE_RESULTS( xBody ) {
	return new Promise( function( resolve , reject ) {
		try {

			try { var $ = cheerio.load( xBody ); }
			catch( err ) { console.log( err ); resolve( [] ); return; }

			var finalResults = [];
			var xResults = $( ".search-results-list" ).children();
			if ( !xResults ) { resolve( [] ); return; }

			$( xResults ).each( function() {

				var wTitle = $( this ).children( ".article--title" );
				if ( wTitle ) {
					if ( wTitle[ 0 ] ) {
						wTitle = $( wTitle[ 0 ] ).children( "a" );
						if ( wTitle ) {
							if ( wTitle[ 0 ] ) {
								wTitle = $( wTitle[ 0 ] ).text();
								if ( wTitle ) { wTitle = wTitle.trim(); }
							}
						}
					}
				}

				var wDOI = $( this ).children( ".article--citation" );
				if ( wDOI ) {
					if ( wDOI[ 0 ] ) {
						wDOI = $( wDOI[ 0 ] ).text();
						if ( wDOI ) { 
							wDOI = wDOI.trim();
							wDOI = wDOI.split( "doi: " )[ 1 ];

							finalResults.push({
								title: wTitle ,
								doi: wDOI ,
								doiB64: EncodeB64( wDOI ) ,
								mainURL: DX_DOI_BASE_URL + "/" + wDOI ,
								scihubURL: SCI_HUB_BASE_URL + wDOI
							});

						}
					}
				}

			});

			resolve( finalResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

const JAMANETWORK_BASE_URL = "https://jamanetwork.com/searchresults?page=1&q=autism&sort=Newest&hd=advancedAny&f_ContentType=Article&rg_ArticleDate=";
function generateSearchURL() {
	
	const today = new Date();
	const wTY = today.getFullYear();
	const wTM = ( today.getMonth() + 1 );
	const wTD = today.getDate();

	var previous = new Date();
	previous.setDate( previous.getDate() - 30 ); // Search Previous 30 Days
	const wPY = today.getFullYear().toString();
	const wPM = ( previous.getMonth() + 1 );
	const wPD = previous.getDate();

	return JAMANETWORK_BASE_URL + wPM + "%2f" + wPD + "%2f" + wPY
		+ "TO" + wTM + "%2f" + wTD + "%2f" + wTY;

}

function SEARCH( wOptions ) {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "" );
			console.log( "Jamanetwork.com Scan Started" );
			PrintNowTime();
			
			// 1.) Search for Results
			var wSearchURL = generateSearchURL();
			var wBody = await MakeRequest( wSearchURL );
			var wResults = await PARSE_RESULTS( wBody );

			// 2.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 3.) Post Uneq Results
			await PostResults( wResults );
			
			console.log( "" );
			console.log( "\nJamanetwork.com Scan Finished" );
			PrintNowTime();
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;