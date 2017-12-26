const puppeteer = require( "puppeteer" );
const cheerio = require( "cheerio" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;
const MONTH_ABREVIATIONS = require( "../CONSTANTS/generic.js" ).MONTH_ABREVIATIONS;


function PARSE_RESULTS( xBody ) {
	return new Promise( function( resolve , reject ) {
		try {

			try { var $ = cheerio.load( xBody ); }
			catch( err ) { console.log( err ); reject( "cheerio load failed" ); return; }

			var wResultList = $( ".results-cit-list" );
			if ( !wResultList ) { console.log( "No Results" ); resolve( [] ); return; }
			wResultList = $( wResultList ).children();

			var finalResults = [];
			$( wResultList ).each( function() {
				
				var wContainer = $( this ).children();
				wContainer = $( wContainer[ 0 ] ).children();

				var wTitle = $( wContainer[ 1 ] ).children( ".cit-title" );
				if ( wTitle ) {
					if ( wTitle[0] ) {
						wTitle = $( wTitle[0] ).text();
						if ( wTitle ) { wTitle = wTitle.trim(); }
					}
				}

				var wDOI = $( wContainer[ 1 ] ).children();
				if ( wDOI ) {
					if ( wDOI[ 3 ] ) {
						wDOI = $( wDOI[ 3 ] ).children();
						if ( wDOI ) {
							var x_i = ( wDOI.length - 1 );
							if ( wDOI[ x_i ] ) {
								wDOI = $( wDOI[ x_i ] ).text();
								wDOI = wDOI.split( "doi:" )[ 1 ];
							}
						}
					}
				}

				finalResults.push({
					title: wTitle , 
					doi: wDOI ,
					doiB64: EncodeB64( wDOI ) ,
					mainURL: DX_DOI_BASE_URL + "/" + wDOI ,
					scihubURL: SCI_HUB_BASE_URL + wDOI
				});

			});

			resolve( finalResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}


const PNAS_URL_BASE = "http://www.pnas.org/search?tmonth=";
const PNAS_URL_P1 = "&pubdate_year=&submit=yes&submit=yes&submit=Submit&andorexacttitle=and&format=standard&firstpage=&fmonth=";
const PNAS_URL_P2 = "&title=&tyear=";
const PNAS_URL_P3 = "&hits=200&titleabstract=autism&volume=&sortspec=date&andorexacttitleabs=or&author2=&tocsectionid=all&andorexactfulltext=and&author1=&fyear=";
const PNAS_URL_P4 = "&doi=&fulltext=";
function generateSearchURL() {

	const wNow = new Date();
	//wNow.setDate( wNow.getDate() + ( 30 * 11 ) );
	const wTY = wNow.getFullYear();
	const wTM = parseInt( wNow.getMonth() + 1 );

	var nextMonth_ABR = null;
	if ( wTM === 12 ) {
		nextMonth_ABR = MONTH_ABREVIATIONS[ wTM - 1 ];
	}
	else {
		nextMonth_ABR = MONTH_ABREVIATIONS[ wTM ];
	}
	
	var previous = wNow;
	previous.setDate( previous.getDate() - 30 ); // Search Previous 30 Days
	const prevYear = previous.getFullYear();
	const prevMonth = parseInt( previous.getMonth() + 1 );
	const prevMonth_ABR = MONTH_ABREVIATIONS[ prevMonth - 1 ];

	return PNAS_URL_BASE + nextMonth_ABR + PNAS_URL_P1 + prevMonth_ABR + PNAS_URL_P2 + wTY
				+  PNAS_URL_P3 + prevYear + PNAS_URL_P4;
}

function SEARCH( wOptions ) {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "" );
			console.log( "Pnas.org Scan Started" );
			PrintNowTime();
			
			// 1.) Search for Results
			const S_URL = generateSearchURL();
			console.log( S_URL );
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto( S_URL , { timeout: ( 150 * 1000 ) , waitUntil: "networkidle2" });
			var wBody = await page.content();
			await browser.close();
			var wResults = await PARSE_RESULTS( wBody );
			console.log( wResults );

			// 2.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 3.) Post Uneq Results
			await PostResults( wResults );
			
			console.log( "" );
			console.log( "\Pnas.org Scan Finished" );
			PrintNowTime();
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;