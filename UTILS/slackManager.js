const Slack = require( "slack" );
var bot = null;

const wToken = require( "../personal.js" ).SLACK_TOKEN;
function POST_MESSAGE( wMessage , wChannel ) {
	return new Promise( async function( resolve , reject ) {
		try {
			await bot.chat.postMessage( { token: wToken , channel: wChannel , text: wMessage  } );
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.post = POST_MESSAGE;

function INITIALIZE() {
	return new Promise( async function( resolve , reject ) {
		try {
			bot = await new Slack( { wToken } );
			resolve();
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.initialize = INITIALIZE;