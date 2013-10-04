exports.action = function(data, callback, config){
	console.log('##### Programme TV #####');

var config = config.modules.progtv;	

	switch (data.request)
	{
	case 'prog':
	get_programme(data, callback, config );
	break;
	default:
	output(callback, "Une erreur s'est produite: ");
	}
}

var get_programme = function (data, callback, config ) {
	var http = require('http'),
	xml2js = require('xml2js');

////////// code to get xml from url
var options = {
  hostname: 'www.codeproject.com',
  port: 80,
  path: '/WebServices/ArticleRSS.aspx',
  method: 'GET'
};

http.get(options, function(res) {
				console.log('STATUS: ' + res.statusCode);
				console.log('HEADERS: ' + JSON.stringify(res.headers));
				res.setEncoding('utf8');
				var fullResponse = "";
				
			res.on('data', function (chunk) {
				
						fullResponse = fullResponse+chunk;
				});
			
			res.on('end', function(){
				xml2js.parseString(fullResponse);
				console.log(item.title + '\n');
				});
		}).on('error', function(e) {
			output(callback, "Une erreur s'est produite: " + e.message);
		});



		
}


var output = function ( callback, output ) {
	console.log(output);
	callback({ 'tts' : output});
}
