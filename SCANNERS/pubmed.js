const request = require( "request" );
const cheerio = require( "cheerio" );
const { map } = require( "p-iteration" );
const PostResults = require( "../UTILS/mastadonManager.js" ).formatPapersAndPost;
const PrintNowTime = require( "../UTILS/genericUtils.js" ).printNowTime;
const EncodeB64 = require( "../UTILS/genericUtils.js" ).encodeBase64;
const FilterUNEQResultsREDIS = require( "../UTILS/genericUtils.js" ).filterUneqResultsCOMMON;


const DX_DOI_BASE_URL = require( "../CONSTANTS/generic.js" ).DX_DOI_BASE_URL;
const SCI_HUB_BASE_URL = require( "../CONSTANTS/generic.js" ).SCI_HUB_BASE_URL;

function getDOICheerio( wPubMedID , wDOIOnly ) {
	return new Promise( async function( resolve , reject ) {
		try {
			const wURL2 = "https://www.ncbi.nlm.nih.gov/pubmed/" + wPubMedID;
			console.log( "\t --> Cherrio.js --> " + wURL2 );
			request( wURL2 , function( wErr , wResponse , wBody ){

				try { var $ = cheerio.load( wBody ); }
				catch(err) { reject( "cheerio load failed" ); return; }

				var wOBJ1 = {};
				var wDOI = null;

				var wTitle = $( ".rprt.abstract" ).children();
				wOBJ1.title = $( wTitle[2] ).text();

				var doi_text = $( ".cit" ).text();
				var doi_start = doi_text.indexOf( "doi:" );
				if ( doi_start !== -1 ) {
					//var doi_end = doi_text.indexOf( " " , ( doi_start + 5 ) );
					doi_text = doi_text.substring( ( doi_start + 5 ) , ( doi_text.length - 1 ) );
					doi_text = doi_text.split( " " )[0];
					//console.log( doi_text );
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
				//console.log( wDOI );
				if ( wDOIOnly ) { resolve( wDOI ); return; }

				wOBJ1.pmid = wPubMedID;
				wOBJ1.mainURL = "https://www.ncbi.nlm.nih.gov/pubmed/" + wPubMedID;
				if ( wDOI ) {
					if ( wDOI.length > 1 ) {
						wOBJ1[ "doi" ] = wDOI;
						wOBJ1[ "doiB64" ] = EncodeB64( wDOI );
						wOBJ1[ "scihubURL" ] = SCI_HUB_BASE_URL + wDOI;
					}
				}
				resolve( wOBJ1 );

			});
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

function getPubMedIDInfo( wPubMedID ) {
	const wURL = "https://api.altmetric.com/v1/pmid/" + wPubMedID;
	return new Promise( function( resolve , reject ) {
		var finalOBJ = {};
		try {
			request( wURL , async function ( err , response , body ) {
				console.log( "\n" + wURL + " --> RESPONSE_CODE = " + response.statusCode.toString() );
				if ( response.statusCode !== 200 ) {
					finalOBJ = await getDOICheerio( wPubMedID );
				}
				else {
					body = JSON.parse( body );
					finalOBJ.pmid = wPubMedID;
					finalOBJ.mainURL = "https://www.ncbi.nlm.nih.gov/pubmed/" + wPubMedID;
					if ( body[ "title" ] ) { finalOBJ.title = body[ "title" ]; }
					if ( body[ "doi" ] ) { 
						finalOBJ.doi = body[ "doi" ]; 
						finalOBJ.doiB64 = EncodeB64( body[ "doi" ] ); 
						finalOBJ.scihubURL = SCI_HUB_BASE_URL + body[ "doi" ];
					}
					else {
						//console.log( "no doi in json .... why ???" );
						finalOBJ.doi = await getDOICheerio( wPubMedID , true );
						finalOBJ.doiB64 = EncodeB64( finalOBJ.doi ); 
						finalOBJ.scihubURL = SCI_HUB_BASE_URL + finalOBJ.doi;
					}
				}
				//console.log( finalOBJ );
				resolve( finalOBJ );
			});
		}
		catch( err ) { console.log(err); reject( err ); }
	});
}

function searchPubMedPreviousDay( wSearchTerms ) {

	const today = new Date();
	const wTY = today.getFullYear();
	const wTM = ( today.getMonth() + 1 );
	const wTD = today.getDate();

	// const yesterday = new Date( Date.now() - 86400000 );
	// const wYY = yesterday.getFullYear();
	// const wYM = ( yesterday.getMonth() + 1 );
	// const wYD = yesterday.getDate();

	var previous = new Date();
	previous.setDate( previous.getDate() - 30 ); // Search Previous 30 Days
	const wYY = previous.getFullYear().toString();
	const wYM = ( previous.getMonth() + 1 );
	const wYD = previous.getDate();

	var wURL = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=%28%28%28";
	const wFinal = wSearchTerms.length - 1;
	for ( var i = 0; i < wSearchTerms.length; ++i ) {
		wURL = wURL + wSearchTerms[ i ] + "%5BTitle%5D%29+AND+%28%22";
		wURL = wURL + wYY + "%2F" + wYM + "%2F" + wYD + "%22%5BDate+-+Publication%5D+%3A+%22";
		wURL = wURL + wTY + "%2F" + wTM + "%2F" + wTD + "%22%5BDate+-+Publication%5D%29%29";
		if ( i !== wFinal ) { wURL = wURL + "+OR+"; }
	}
	wURL = wURL + "&retmode=json&retmax=1000";

	console.log( "\n" + wURL + "\n" );

	return new Promise( function( resolve , reject ) {
		var wResults = [];
		try {
			request( wURL , function ( err , response , body ) {
				if ( response.statusCode !== 200 ) { reject(err); }
				body = JSON.parse( body );
				if ( body[ "esearchresult" ][ "idlist" ] ) {
					var wID_LIST = body[ "esearchresult" ][ "idlist" ];
					resolve( wID_LIST );
					return;
				}
				else { resolve([]); return; }
			});
		}
		catch( err ) { console.log(err); reject(err); }
	});

}

function SEARCH_PUBLISHED_TODAY_TITLE( wTerms ) {
	return new Promise( async function( resolve , reject ) {
		try {
			console.log( "\nStarted PubMed Hourly Scan" );
			PrintNowTime();

			// 1.) Get List of PubMedId's ***published (pubmed dates are confusing) *** previous 24 hours 
			const wPubMedRawResults = await searchPubMedPreviousDay( wTerms );
			if ( !wPubMedRawResults ) { console.log( "no pubmed results" ); PrintNowTime(); resolve(); return; }
			if ( wPubMedRawResults.length < 1 ) { console.log( "no pubmed results" ); PrintNowTime(); resolve(); return; }
			
			// 2.) Gather "meta" data about each of them
			var wPubMedResultsWithMetaData = await map( wPubMedRawResults , pubmedID => getPubMedIDInfo( pubmedID ) );
			wPubMedResultsWithMetaData = await FilterUNEQResultsREDIS( wPubMedResultsWithMetaData );

			// 3.) Post Results
			await PostResults( wPubMedResultsWithMetaData );

			console.log( "\nPubMed Hourly Scan Finished" );
			PrintNowTime();
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.search = SEARCH_PUBLISHED_TODAY_TITLE;