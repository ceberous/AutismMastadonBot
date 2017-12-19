const cheerio = require( "cheerio" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const MPDI_BASE_URL = "http://www.mdpi.com";
const DX_DOI_BASE_URL = "http://dx.doi.org";
const SCI_HUB_BASE_URL = DX_DOI_BASE_URL + ".sci-hub.tw/";

function PARSE_RESULTS( wBody ) {
	return new Promise( function( resolve , reject ) {
		try {

			try { var $ = cheerio.load( wBody ); }
			catch(err) { reject( "cheerio load failed" ); return; }

			var finalResults = [];
			$( ".article-content" ).each( function() {

				var wTitle_Link = $( this ).children( ".title-link" );
				var wTitle = $( wTitle_Link ).text();
				if ( wTitle ) { wTitle = wTitle.trim(); }
				wTitle_Link = $( wTitle_Link ).attr( "href" );
				wTitle_Link = MPDI_BASE_URL + wTitle_Link;

				var wDOI = $( this ).children( ".idnt" );
				wDOI = $( wDOI ).children( "a" ).attr("href");

				var wPaper_URL = wTitle_Link + "/pdf";
				// var wMainURL = $( this ).children();
				// $( wMainURL ).each( function() {
				// 	var wChildren = $( this ).children( "a" );
				// 	$( wChildren ).each( function() {
				// 		var wThis_URL = $( this ).attr("href");
				// 		if ( wThis_URL ) {
				// 			var wTest = wThis_URL.substring( ( wThis_URL.length - 3 ) , wThis_URL.length );
				// 			if ( wTest === "pdf" ) {
				// 				//console.log( wThis_URL );
				// 				wPaper_URL = "http://www.mdpi.com" + wThis_URL; 
				// 				return;
				// 			}
				// 		}
				// 	});
				// 	if ( wPaper_URL !== null ) { return; }
				// });

				finalResults.push({
					title: wTitle , 
					doi: wDOI ,
					doiB64: EncodeB64( wDOI ) ,
					mainURL: wTitle_Link ,
					scihubURL: wPaper_URL
				});

			});

			resolve( finalResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}


const MDPI_SEARCH_URL = "http://www.mdpi.com/search?year_from=1996&year_to=2017&page_count=50&sort=pubdate&advanced=(%40(title)autism)%7C(%40(abstract)autism)&view=default";

function SEARCH( wOptions ) {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "" );
			console.log( "MDPI.com Scan Started" );
			PrintNowTime();
			
			// 1.) Search for Results
			var wBody = await MakeRequest( MDPI_SEARCH_URL );
			var wResults = await PARSE_RESULTS( wBody );

			// 2.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 3.) Post Uneq Results
			await PostResults( wResults );
			
			console.log( "" );
			console.log( "\nMDPI.com Scan Finished" );
			PrintNowTime();
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;