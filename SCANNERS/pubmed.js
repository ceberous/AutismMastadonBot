const cheerio = require( "cheerio" );
const { map } = require( "p-iteration" );

const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const MakeRequest = require( "../UTILS/genericUtils.js" ).makeRequest;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;
const wSleep = require( "../UTILS/genericUtils.js" ).wSleep;
const redis = require( "../UTILS/redisManager.js" ).redisClient;
const RU = require( "../UTILS/redisUtils.js" );

const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

const NCBI_NIH_ARTICLE_BASE_URL = "https://www.ncbi.nlm.nih.gov/pubmed/";
function getDOICheerio( wPubMedID , wDOIOnly ) {
	return new Promise( async function( resolve , reject ) {
		try {
			const wURL2 = NCBI_NIH_ARTICLE_BASE_URL + wPubMedID;
			console.log( "\t --> Cherrio.js --> " + wURL2 );
			
			var wBody = await MakeRequest( wURL2 );
			try { var $ = cheerio.load( wBody ); }
			catch(err) { reject( "cheerio load failed" ); return; }

			var wOBJ1 = {};
			var wDOI = null;

			var wTitle = $( ".rprt.abstract" ).find( "h1" );
			wTitle = $( wTitle[0] ).text();
			wOBJ1.title = wTitle;
			//console.log( wTitle );

			var doi_text = $( 'div[class="cit"]' ).text();
			var doi_start = doi_text.indexOf( "doi:" );
			if ( doi_start !== -1 ) {
				doi_text = doi_text.substring( ( doi_start + 5 ) , ( doi_text.length - 1 ) );
				//console.log( doi_text );
				doi_text = doi_text.split( " " )[0];
				doi_text = doi_text.replace( /\s/g , "" );
				if ( doi_text[ doi_text.length - 1 ] === "." ) {
					doi_text = doi_text.substring( 0 , ( doi_text.length - 1 ) );
				}
				wDOI = doi_text;
			}
			else {
				$( "a" ).each( function () {
					var wID = $( this ).attr( "href" );
					wDOI = wID.substring( 0 , 10 );
					if ( wDOI === "//doi.org/" ) {
						wDOI = wID.substring( 10 , wID.length );
						console.log( "doi found in URL ..." );
						console.log( wID );
					}
				});
			}

			console.log( "\t\t--> " + wDOI );
			if ( wDOIOnly ) { resolve( wDOI ); return; }

			wOBJ1.pmid = wPubMedID;
			wOBJ1.mainURL = NCBI_NIH_ARTICLE_BASE_URL + wPubMedID;
			if ( wDOI ) {
				if ( wDOI.length > 3 ) {
					wOBJ1[ "doi" ] = wDOI;
					if ( !isNaN( wDOI[ 0 ] ) && !isNaN( wDOI[ 1 ] ) ) {
						wOBJ1[ "doiB64" ] = EncodeB64( wDOI );
						wOBJ1[ "scihubURL" ] = SCI_HUB_BASE_URL + wDOI;
					}
					else { wOBJ1[ "doiB64" ] = EncodeB64( wOBJ1.mainURL ); }
				}
			}
			resolve( wOBJ1 );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

const PUB_MED_API_BASE_URL = "https://api.altmetric.com/v1/pmid/"; 
function getPubMedIDInfo( wPubMedID ) {
	const wURL = PUB_MED_API_BASE_URL + wPubMedID;
	return new Promise( async function( resolve , reject ) {
		try {
			var wBody = await MakeRequest( wURL );
			if ( !wBody ) { resolve( { pmid: wPubMedID } ); return; }
			try { wBody = JSON.parse( wBody ); }
			catch( e ) { resolve( { pmid: wPubMedID } ); return; }
			var finalOBJ = {};
			finalOBJ.pmid = wPubMedID;
			finalOBJ.mainURL = NCBI_NIH_ARTICLE_BASE_URL + wPubMedID;
			if ( wBody[ "title" ] ) { finalOBJ.title = wBody[ "title" ]; }
			if ( wBody[ "doi" ] ) {
				console.log( "\t\t--> " + wBody[ "doi" ] );
				finalOBJ.doi = wBody[ "doi" ]; 
				finalOBJ.doiB64 = EncodeB64( wBody[ "doi" ] ); 
				finalOBJ.scihubURL = SCI_HUB_BASE_URL + wBody[ "doi" ];
			}
			resolve( finalOBJ );
		}
		catch( err ) { console.log(err); reject( err ); }
	});
}

const R_PUBMED_ARTICLES = "PUBMED.ARTICLES.ALREADY_TRACKED";
function FILTER_ALREADY_TRACKED_PUBMED_ARTICLE_IDS( wResults ) {
	return new Promise( async function( resolve , reject ) {
		try {
			const wTempKey = Math.random().toString(36).substring(7);
			const R_PLACEHOLDER = "SCANNERS." + wTempKey + ".PLACEHOLDER";
			const R_NEW_TRACKING = "SCANNERS." + wTempKey + ".NEW_TRACKING";

			await RU.setSetFromArray( redis , R_PLACEHOLDER , wResults );
			await RU.setDifferenceStore( redis , R_NEW_TRACKING , R_PLACEHOLDER , R_PUBMED_ARTICLES );
			await RU.delKey( redis , R_PLACEHOLDER );

			const wNewTracking = await RU.getFullSet( redis , R_NEW_TRACKING );
			if ( !wNewTracking ) { 
				await RU.delKey( redis , R_NEW_TRACKING ); 
				//console.log( "nothing new found" ); 
				//PrintNowTime(); 
				resolve( [] );
				return;
			}
			if ( wNewTracking.length < 1 ) {
				await RU.delKey( redis , R_NEW_TRACKING );
				//console.log( "nothing new found" ); 
				//PrintNowTime();
				resolve( [] );
				return;
			}
			wResults = wResults.filter( x => wNewTracking.indexOf( x ) !== -1 );
			await RU.delKey( redis , R_NEW_TRACKING );
			await RU.setSetFromArray( redis , R_PUBMED_ARTICLES , wResults );
			resolve( wResults );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function generateSearchURL( wSearchTerms ) {
	wSearchTerms = wSearchTerms || [ "autism" , "autistic" ];
	var today = new Date();
	today.setDate( today.getDate() + 30 );
	const wTY = today.getFullYear();
	const wTM = ( today.getMonth() + 1 );
	const wTD = today.getDate();

	var previous = new Date();
	previous.setDate( previous.getDate() - 60 ); // Search Previous 30 Days
	const wYY = previous.getFullYear().toString();
	const wYM = ( previous.getMonth() + 1 );
	const wYD = previous.getDate();

	var wURL = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=%28%28%28";
	const wFinal = wSearchTerms.length - 1;
	for ( var i = 0; i < wSearchTerms.length; ++i ) {
		wURL = wURL + wSearchTerms[ i ] + "%5BTitle/Abstract%5D%29+AND+%28%22";
		wURL = wURL + wYY + "%2F" + wYM + "%2F" + wYD + "%22%5BDate+-+Publication%5D+%3A+%22";
		wURL = wURL + wTY + "%2F" + wTM + "%2F" + wTD + "%22%5BDate+-+Publication%5D%29%29";
		if ( i !== wFinal ) { wURL = wURL + "+OR+"; }
	}
	wURL = wURL + "&retmode=json&retmax=1000";
	return wURL;
}

function SEARCH( wSearchTerms ) {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "\nStarted PubMed Hourly Scan" );
			PrintNowTime();

			// 1.) Get List of PubMedId's ***published *** in search interval
			const wSearchURL = generateSearchURL( wSearchTerms );
			var wPubMedResultIDS = await MakeRequest( wSearchURL );
			wPubMedResultIDS = JSON.parse( wPubMedResultIDS );
			if ( wPubMedResultIDS[ "esearchresult" ] ) {
				if ( wPubMedResultIDS[ "esearchresult" ][ "idlist" ] ) {
					wPubMedResultIDS = wPubMedResultIDS[ "esearchresult" ][ "idlist" ];
				}
			}
			if ( !wPubMedResultIDS ) { console.log( "no pubmed results" ); PrintNowTime(); resolve(); return; }
			if ( wPubMedResultIDS.length < 1 ) { console.log( "no pubmed results" ); PrintNowTime(); resolve(); return; }

			// 2.) Filter From already 'Tracked' PubMed-Article-IDS in Redis
			wPubMedResultIDS = await FILTER_ALREADY_TRACKED_PUBMED_ARTICLE_IDS( wPubMedResultIDS );
			if ( !wPubMedResultIDS ) { console.log( "no new pubmed results" ); PrintNowTime(); resolve(); return; }
			if ( wPubMedResultIDS.length < 1 ) { console.log( "no new pubmed results" ); PrintNowTime(); resolve(); return; }			
			//console.log( wPubMedResultIDS );
			
			// 3.) Gather "meta" data about each of them - via JSON endpoint
			var wPubMedResultsWithMetaData = await map( wPubMedResultIDS , pubmedID => getPubMedIDInfo( pubmedID ) );

			// 4.) For all the ones that failed , lookup "meta" stuff via ncbi.nlm.nih.gov
			var wFailed = wPubMedResultsWithMetaData.filter( x => x[ "doi" ] === undefined );
			wPubMedResultsWithMetaData = wPubMedResultsWithMetaData.filter( x => x[ "doi" ] !== undefined );
			var wFailedIDS = wFailed.map( x => x[ "pmid" ] );
			wFailed = await map( wFailedIDS , pubmedID => getDOICheerio( pubmedID ) );
			for ( var i = 0; i < wFailed.length; ++i ) {
				wPubMedResultsWithMetaData.push( wFailed[ i ] );
			}
			wPubMedResultsWithMetaData = wPubMedResultsWithMetaData.filter( x => x[ "doi" ] !== undefined );

			// 5.) Filter Uneq Results
			wPubMedResultsWithMetaData = await FilterUNEQResultsREDIS( wPubMedResultsWithMetaData );
			//const PUBMED_IDS_FINAL = wPubMedResultsWithMetaData.map( x => x[ "pmid" ] );
			//console.log( PUBMED_IDS_FINAL );
			//await RU.setSetFromArray( redis , R_PUBMED_ARTICLES , PUBMED_IDS_FINAL );

			// // 6.) Post Results
			await PostResults( wPubMedResultsWithMetaData );

			console.log( "\nPubMed Hourly Scan Finished" );
			PrintNowTime();
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH;