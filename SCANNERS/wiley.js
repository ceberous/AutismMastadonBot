const cheerio = require( "cheerio" );
const { map } = require( "p-iteration" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

const WILEY_ARTICLE_BASE_URL = "http://onlinelibrary.wiley.com/doi/";
const WILEY_SEARCH_URL_BASE = "http://onlinelibrary.wiley.com/advanced/search/results/reentry?scope=allContent&dateRange=inTheLast&inTheLastList=1&startYear=&endYear=&queryStringEntered=false&searchRowCriteria[0].queryString=autism&searchRowCriteria[0].fieldName=publication-title&searchRowCriteria[0].booleanConnector=or&searchRowCriteria[1].queryString=autism&searchRowCriteria[1].fieldName=document-title&searchRowCriteria[1].booleanConnector=or&searchRowCriteria[2].queryString=autism&searchRowCriteria[2].fieldName=abstract&searchRowCriteria[2].booleanConnector=and&publicationFacet=journal&ordering=date&resultsPerPage=20";
const WILEY_SEARCH_URL_SECONDARY = WILEY_SEARCH_URL_BASE + "&start=";

function CUSTOM_RESULT_PAGE_PARSER( wBody ) {
	return new Promise( function( resolve , reject ) {
		try {
			var finalResults = [];
			try { var $ = cheerio.load( wBody ); }
			catch(err) { reject( "cheerio load failed" ); return; }

			// 2. ) Gather Results from Main-Page
			$( ".citation.article" ).each( function() {
				var wA_TAG = $( this ).children("a");
				var wDOI = $( wA_TAG ).attr( "href" );
				wDOI = wDOI.split( "/doi/" )[1];
				wDOI = wDOI.split( "/full" )[0];
				var wTitle = $( wA_TAG ).text();
				if ( wTitle ) { wTitle = wTitle.trim(); }
				finalResults.push({
					title: wTitle ,
					doi: wDOI ,
					doiB64: EncodeB64( wDOI ) ,
					mainURL: WILEY_ARTICLE_BASE_URL + wDOI + "/abstract" ,
					scihubURL: WILEY_ARTICLE_BASE_URL + wDOI + "/epdf" + " Mirror-Paper: " + SCI_HUB_BASE_URL + wDOI  ,
				});
			});
			resolve( finalResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function FETCH_AND_PARSE_SINGLE_RESULT_PAGE( wURL ) {
	return new Promise( async function( resolve , reject ) {
		try {
			var wPageBody = await MakeRequest( wURL );
			var finalResults = await CUSTOM_RESULT_PAGE_PARSER( wPageBody );
			resolve( finalResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function CUSTOM_SEARCHER() {
	return new Promise( async function( resolve , reject ) {
		try {

			// 1.) Search Base Search URL 
			var wMainPageBody = await MakeRequest( WILEY_SEARCH_URL_BASE );
			
			// 2.) Parse Initial Main-Page
			var finalResults = await CUSTOM_RESULT_PAGE_PARSER( wMainPageBody );

			// 3.) Based on Number of Results , build remaining search URLS
			// ***limited by them to 20 per page***
			try { var $ = cheerio.load( wMainPageBody ); }
			catch( err ) { reject( "cheerio load failed" ); return; }			
			var wTotalResults = $( "#searchedForText" ).children("em");
			wTotalResults = $( wTotalResults[0] ).text();
			wTotalResults = parseInt( wTotalResults );
			console.log( "\nTotal Search Results = " + wTotalResults.toString() + "\n" );
			var wRemainingSearchURLS = [];
			var wStartIndex = 21;
			while ( wStartIndex < wTotalResults ) {
				var wURL = WILEY_SEARCH_URL_SECONDARY + wStartIndex.toString();
				wRemainingSearchURLS.push( wURL );
				wStartIndex = wStartIndex + 20;
			}

			// 4. ) Search Secondary Pages
			var wSecondaryPageResults = await map( wRemainingSearchURLS , wURL => FETCH_AND_PARSE_SINGLE_RESULT_PAGE( wURL ) );
			for ( var i = 0; i < wSecondaryPageResults.length; ++i ) {
				finalResults.push( wSecondaryPageResults[ i ] );
			}
			//finalResults = [].concat.apply( [] , wSecondaryPageResults );

			resolve( finalResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}


function SEARCH( wOptions ) {
	return new Promise( async function( resolve , reject ) {
		try {

			console.log( "" );
			console.log( "\nWiley.com Scan Started" );
			PrintNowTime();

			// 1.) Gather Main-Page Results
			var finalResults = await CUSTOM_SEARCHER();

			// 2.) Compare and Store 'Uneq' Results
			finalResults = await FilterUNEQResultsREDIS( finalResults );
			console.log( finalResults );

			// 3.) Post Uneq Results
			await PostResults( finalResults );
			
			console.log( "" );
			console.log( "\nWiley.com Scan Finished" );
			PrintNowTime();

			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;