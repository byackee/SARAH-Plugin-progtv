exports.action = function(data, callback, config){
	console.log('##### Programme TV #####');

var config = config.modules.progtv;	

	switch (data.request)
	{
	case 'prog':
	get_programme(prog, data, callback, config );
	break;
	case 'liste':
	get_programme(liste, data, callback, config );
	break;
	default:
	output(callback, "Une erreur s'est produite: ");
	}
}

var get_programme = function (action, data, callback, config ) {
	var http = require('http'),
	xml2js = require('xml2js');
	var parser = new xml2js.Parser({trim: true});

	var options = {
		hostname: 'www.kazer.org',
		port: 80,
		path: '/tvguide.xml?u=' + config.Kazeruserkey,
		method: 'GET'
	};

	http.get(options, function(res) {
		res.setEncoding('utf8');
		var fullResponse = "";
				
		res.on('data', function (chunk) {
			fullResponse = fullResponse+chunk;
		});
			
		res.on('end', function(){
			parser.parseString(fullResponse, function (err, result) {
				
				updatechannel(result.tv.channel, data, callback, config);
				action(result, data, callback, config);
				
	
			});
		});
		
		}).on('error', function(e) {
			output(callback, "Une erreur s'est produite: " + e.message);
		});

}

var prog = function ( result, data, callback, config) {

	if (!data.time){ 
		var timevalue = "now"; 
	}else{
		var timevalue = data.time;
	}
		
	var text = data.channel;
		for ( var i = 0; i < result.tv.channel.length; i++ ) {
			var channel = result.tv.channel[i];
			var tokens = channel.$.id.split(' ');
			var found = true;
			for ( var j = 0; found && j < tokens.length; j++ ) {
				found = new RegExp(tokens[j],'i').test(text);
			}
					
			if ( found ) {
				for ( var i = 0; i < result.tv.programme.length; i++ ) {
					var programme = result.tv.programme[i];
					var tokens = programme.$.channel.split(' ');
					var found = true;
					for ( var j = 0; found && j < tokens.length ; j++ ) {
						found = new RegExp(tokens[j],'i').test(text);
					}
					if (found){
						if ( parseInt(calcultime(timevalue)) < parseInt(programme.$.stop.substring(0,14)) && parseInt(calcultime(timevalue)) > parseInt(programme.$.start.substring(0,14))){
							output (callback, convertChannelName(data.channel,result, data, callback, config) + " " + programme.title);
						}
					}
				}
					
						
			}
			
		}
}

var liste = function ( result, data, callback, config) {
var parle ="";
	if (!data.time){ 
		var timevalue = "now"; 
	}else{
		var timevalue = data.time;
	}
		
				for ( var i = 0; i < result.tv.programme.length; i++ ) {
					var programme = result.tv.programme[i];
					var tokens = programme.$.channel.split(' ');
					var found = true;
						if ( parseInt(calcultime(timevalue)) < parseInt(programme.$.stop.substring(0,14)) && parseInt(calcultime(timevalue)) > parseInt(programme.$.start.substring(0,14))){
							parle += convertChannelName(tokens, result, data, callback, config) + " " + programme.title + "<br>";
						}
			
				}
					
			output (callback, parle);			

}

var updatechannel = function (channel, data, callback, config){
console.log("***** UPDATE CHANNELS *****");

	if (!data.directory){ 
	console.log('il n\'y a pas de dossier spécifié');
	return false; 
	}

	var fs   = require('fs');
	var file = data.directory + '/../plugins/progtv/progtv.xml';
	var xml  = fs.readFileSync(file,'utf8');
  
	var replace  = '@ -->\n';
	replace += '  <one-of>\n';
	for ( var i = 0; i < channel.length; i++ ) {
		var tokens = channel[i];
		replace +='    <item>'+tokens["display-name"]+'<tag>out.action.channel="'+ tokens.$.id+'"</tag></item>\n';
		console.log('ajout de : ' + tokens["display-name"]);

		}
			replace += '  </one-of>\n';
	replace += '<!-- @';
	var regexp = new RegExp('@[^@]+@','gm');
	var xml    = xml.replace(regexp,replace);
	fs.writeFileSync(file, xml, 'utf8');
}

var output = function ( callback, output ) {
	console.log(output);
	callback({ 'tts' : output});
}

var calcultime = function (dateString){
var date = new Date();
var properlyFormatted = date.getFullYear() + ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + date.getDate()).slice(-2);

switch (dateString)
	{
	case 'now':
		return properlyFormatted + date.getHours() + date.getMinutes() + date.getSeconds() ;
	break;
	case 'evening':
		return properlyFormatted + "210000" ; // tous les programmes du soir commencent avant 21heures
	break;
	default:
	 }

}

var output = function ( callback, output ) {
	console.log(output);
	callback({ 'tts' : output});
}

var convertChannelName = function(channelid, result, data, callback, config) {
		for ( var i = 0; i < result.tv.channel.length; i++ ) {
			var channel = result.tv.channel[i];
			var tokens = channel.$.id.split(' ');
			var found = true;
			for ( var j = 0; found && j < tokens.length; j++ ) {
				found = new RegExp(tokens[j],'i').test(channelid);
			}
					
			if ( found ) {
				if (channelid = result.tv.channel[i]["display-name"]){
				return result.tv.channel[i]["display-name"];
			}
		}
	}
}