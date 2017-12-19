const REDIS = require( "redis" );

var redis = null;
function INITIALIZE() {
	return new Promise( async function( resolve , reject ) {
		try {

			redis = await REDIS.createClient({ 
				host: "localhost" ,
				
				// Production
				// port: "6379" ,
				// db: "6" ,

				//Local-Testing
				port: "8443" ,
				db: "8" ,

				retry_strategy: function ( options ) {
			        if (options.error && options.error.code === 'ECONNREFUSED') {
			            // End reconnecting on a specific error and flush all commands with
			            // a individual error
			            return new Error('The server refused the connection');
			        }
			        if ( options.total_retry_time > 1000 * 60 * 60 ) {
			            // End reconnecting after a specific timeout and flush all commands
			            // with a individual error
			            return new Error('Retry time exhausted');
			        }
			        if ( options.attempt > 20 ) {
			            // End reconnecting with built in error
			            return undefined;
			        }
			        // reconnect after
			        return Math.min( options.attempt * 100 , 3000 );
			    }
			});
			module.exports.redis = redis;
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}

module.exports.initialize = INITIALIZE;