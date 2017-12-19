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