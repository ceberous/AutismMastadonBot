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