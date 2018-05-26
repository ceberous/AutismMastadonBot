function SET_KEY( rInstance , wKey , wItem ) {
	return new Promise( function( resolve , reject ) {
		try { rInstance.set( wKey , wItem , function( err , keys ) { resolve( keys ); }); }
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.setKey = SET_KEY;

function SET_ADD( rInstance , wKey , wItem ) {
	return new Promise( function( resolve , reject ) {
		try { rInstance.sadd( wKey , wItem , function( err , keys ) { resolve( keys ); }); }
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.setAdd = SET_ADD;

function HASH_SET( rInstance , wHashKey , wKey , wItem ) {
	return new Promise( function( resolve , reject ) {
		try { rInstance.hset( wHashKey , wKey , wItem , function( err , keys ) { resolve( keys ); }); }
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.hashSet = HASH_SET;

function SET_SET_FROM_ARRAY( rInstance , wKey , wArray ) {
	return new Promise( function( resolve , reject ) {
		try { rInstance.sadd.apply( rInstance , [ wKey ].concat( wArray ).concat( function( err , keys ){ resolve( keys ); })); }
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.setSetFromArray = SET_SET_FROM_ARRAY;

function SET_DIFFERENCE_STORE( rInstance , wStoreKey , wSetKey , wCompareSetKey  ) {
	return new Promise( function( resolve , reject ) {
		try { rInstance.sdiffstore( wStoreKey , wSetKey , wCompareSetKey , function( err , values ) { resolve( values ); }); }
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.setDifferenceStore = SET_DIFFERENCE_STORE;


function DELETE_KEY( rInstance , wKey ) {
	return new Promise( function( resolve , reject ) {
		try { rInstance.del( wKey , function( err , keys ) { resolve( keys ); }); }
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.delKey = DELETE_KEY;


function GET_FULL_SET( rInstance , wKey ) {
	return new Promise( function( resolve , reject ) {
		try { rInstance.smembers( wKey , function( err , values ) { resolve( values ); }); }
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.getFullSet = GET_FULL_SET;

function FILTER_ARRAY_ITEMS_ALREADY_IN_SET( rInstance , wKey , wArray ) {
	return new Promise( async function( resolve , reject ) {
		try { 
			const wTempKey = Math.random().toString( 36 ).substring( 7 );
			var R_PLACEHOLDER = "SCANNERS." + wTempKey + ".PLACEHOLDER";
			var R_NEW_TRACKING = "SCANNERS." + wTempKey + ".NEW_TRACKING";

			await SET_SET_FROM_ARRAY( rInstance , R_PLACEHOLDER , wArray );
			await SET_DIFFERENCE_STORE( rInstance , R_NEW_TRACKING , R_PLACEHOLDER , wKey );
			await DELETE_KEY( rInstance , R_PLACEHOLDER );

			const wNewTracking = GET_FULL_SET( rInstance , R_NEW_TRACKING );
			if ( wNewTracking ) {
				if ( wNewTracking.length > 0 ) {
					wArray = wArray.filter( x => wNewTracking.indexOf( x ) !== -1 );				
				}
			}
			await DELETE_KEY( rInstance , R_NEW_TRACKING );
			resolve( wArray );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.filterArrayItemsAlreadyInSet = FILTER_ARRAY_ITEMS_ALREADY_IN_SET;