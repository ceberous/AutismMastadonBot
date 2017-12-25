//const request = require( "request" ).defaults({maxRedirects:20}); // even this fails , need puppeteer
const puppeteer = require( "puppeteer" );
const cheerio = require( "cheerio" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

function PARSE_RESULTS( wBody ) {
	return new Promise( function( resolve , reject ) {
		try {

			try { var $ = cheerio.load( wBody ); }
			catch(err) { reject( "cheerio load failed" ); return; }

			var finalResults = [];
			$( ".article-details" ).each( function() {

				var wTitle = $( this ).children( ".articleTitle" ).text();
				var wDOI = $( this ).children( ".doi" ).text();

				if ( wTitle && wDOI ) {
					if ( wTitle.length > 0 && wDOI.length > 0 ) {
						var wDOI_ID = wDOI.split( "dx.doi.org/" )[1];

						finalResults.push({
							title: wTitle ,
							doi: wDOI_ID ,
							doiB64: EncodeB64( wDOI_ID ) ,
							mainURL: wDOI ,
							scihubURL: SCI_HUB_BASE_URL + wDOI_ID
						});

					}
				}

			});

			resolve( finalResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

const SEARCH_THIS_WEEK_URL = "http://www.cell.com/action/doSearch?journalCode=&searchText1=autism&occurrences1=articleTitle&op1=or&searchText2=autism&occurrences2=abstract&seriesISSNFltraddfilter=0002-9297&seriesISSNFltraddfilter=0006-3495&seriesISSNFltraddfilter=1535-6108&seriesISSNFltraddfilter=0092-8674&seriesISSNFltraddfilter=2451-9456&seriesISSNFltraddfilter=1931-3128&seriesISSNFltraddfilter=1550-4131&seriesISSNFltraddfilter=2211-1247&seriesISSNFltraddfilter=1934-5909&seriesISSNFltraddfilter=2405-4712&seriesISSNFltraddfilter=2451-9294&seriesISSNFltraddfilter=0960-9822&seriesISSNFltraddfilter=1534-5807&seriesISSNFltraddfilter=1074-7613&seriesISSNFltraddfilter=2589-0042&seriesISSNFltraddfilter=2542-4785&seriesISSNFltraddfilter=1097-2765&seriesISSNFltraddfilter=1674-2052&seriesISSNFltraddfilter=1525-0016&seriesISSNFltraddfilter=2329-0501&seriesISSNFltraddfilter=2162-2531&seriesISSNFltraddfilter=2372-7705&seriesISSNFltraddfilter=0896-6273&seriesISSNFltraddfilter=2213-6711&seriesISSNFltraddfilter=0969-2126&seriesISSNFltraddfilter=0968-0004&seriesISSNFltraddfilter=0167-7799&seriesISSNFltraddfilter=2405-8033&seriesISSNFltraddfilter=0962-8924&seriesISSNFltraddfilter=1364-6613&seriesISSNFltraddfilter=0169-5347&seriesISSNFltraddfilter=1043-2760&seriesISSNFltraddfilter=0168-9525&seriesISSNFltraddfilter=1471-4906&seriesISSNFltraddfilter=0966-842X&seriesISSNFltraddfilter=1471-4914&seriesISSNFltraddfilter=0166-2236&seriesISSNFltraddfilter=1471-4922&seriesISSNFltraddfilter=0165-6147&seriesISSNFltraddfilter=1360-1385&date=range&dateRange=1w&searchAttempt=&searchType=advanced&doSearch=Search";

const SEARCH_PAST_MONTH_URL = "http://www.cell.com/action/doSearch?journalCode=&searchText1=autism&occurrences1=articleTitle&op1=or&searchText2=autism&occurrences2=abstract&seriesISSNFltraddfilter=0002-9297&seriesISSNFltraddfilter=0006-3495&seriesISSNFltraddfilter=1535-6108&seriesISSNFltraddfilter=0092-8674&seriesISSNFltraddfilter=2451-9456&seriesISSNFltraddfilter=1931-3128&seriesISSNFltraddfilter=1550-4131&seriesISSNFltraddfilter=2211-1247&seriesISSNFltraddfilter=1934-5909&seriesISSNFltraddfilter=2405-4712&seriesISSNFltraddfilter=2451-9294&seriesISSNFltraddfilter=0960-9822&seriesISSNFltraddfilter=1534-5807&seriesISSNFltraddfilter=1074-7613&seriesISSNFltraddfilter=2589-0042&seriesISSNFltraddfilter=2542-4785&seriesISSNFltraddfilter=1097-2765&seriesISSNFltraddfilter=1674-2052&seriesISSNFltraddfilter=1525-0016&seriesISSNFltraddfilter=2329-0501&seriesISSNFltraddfilter=2162-2531&seriesISSNFltraddfilter=2372-7705&seriesISSNFltraddfilter=0896-6273&seriesISSNFltraddfilter=2213-6711&seriesISSNFltraddfilter=0969-2126&seriesISSNFltraddfilter=0968-0004&seriesISSNFltraddfilter=0167-7799&seriesISSNFltraddfilter=2405-8033&seriesISSNFltraddfilter=0962-8924&seriesISSNFltraddfilter=1364-6613&seriesISSNFltraddfilter=0169-5347&seriesISSNFltraddfilter=1043-2760&seriesISSNFltraddfilter=0168-9525&seriesISSNFltraddfilter=1471-4906&seriesISSNFltraddfilter=0966-842X&seriesISSNFltraddfilter=1471-4914&seriesISSNFltraddfilter=0166-2236&seriesISSNFltraddfilter=1471-4922&seriesISSNFltraddfilter=0165-6147&seriesISSNFltraddfilter=1360-1385&date=range&dateRange=1m&searchAttempt=&searchType=advanced&doSearch=Search&sortBy=date";

function FETCH_RESULTS( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {
			
			console.log( wURL );
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto( wURL , { waitUntil: "networkidle2" });
			var wResults = await page.content();
			await browser.close();
			var wParsed_Results = await PARSE_RESULTS( wResults );
			resolve( wParsed_Results );

		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}


function SEARCH( wOptions ) {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "" );
			console.log( "\nCell.com Scan Started" );
			PrintNowTime();

			// 1.) Search and Gather Results
			var wTimeLine_Url = SEARCH_THIS_WEEK_URL;
			if ( wOptions[ 0 ] ) {
				if ( wOptions[ 0 ] === "month" ) {
					wTimeLine_Url = SEARCH_PAST_MONTH_URL;
				}
			}
			var wResults = await FETCH_RESULTS( wTimeLine_Url );
			console.log( wResults );

			// 2.) Compare to Already 'Tracked' DOIs and Store Uneq
			wResults = await FilterUNEQResultsREDIS( wResults );

			// 3.) Post Uneq
			await PostResults( wResults );

			console.log( "" );
			console.log( "Cell.com Scan Finished" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;
