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
console.log("***** connection *****");
	var fs = require('fs'),
	xml2js = require('xml2js');
	var parser = new xml2js.Parser({trim: true});

	fs.readFile(__dirname + '/tvguide.xml', function(err, dataxml) {
		parser.parseString(dataxml, function (err, result) {
				updatechannel(result.tv.channel, data, callback, config);
				action(result, data, callback, config);		
			});
	});

	

}

var prog = function ( result, data, callback, config) {
console.log("***** recuperation des programmes *****");
var parle ="";
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
							parle += "programme pour " + convertChannelName(tokens, result, data, callback, config) + " " + programme.title;
						}
					}
				}
					
						
			}
			
		}
		output (callback, parle);
}

var liste = function ( result, data, callback, config) {
console.log("***** recuperation des listes programmes *****");
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
							
							parle += "programme pour " + convertChannelName(tokens, result, data, callback, config) + " " + programme.title + " .";
						}
			
				}
					
			output (callback, parle);			

}

var updatechannel = function (channel, data, callback, config){
console.log("***** update channels *****");

	var fs   = require('fs');
	var file = data.directory + '/../plugins/progtv/progtv.xml';
	var xml  = fs.readFileSync(file,'utf8');
  
	var replace  = '@ -->\n';
	replace += '  <one-of>\n';
	MAJneeded=false;
	for ( var i = 0; i < channel.length; i++ ) {
		var tokens = channel[i];
		replace +='    <item>'+tokens["display-name"]+'<tag>out.action.channel="'+ tokens.$.id+'"</tag></item>\n';
		try {
			var regexp2 = new RegExp('<tag>out.action.channel="'+ tokens.$.id+'"</tag>','g');
			if (!xml.match(regexp2)) { MAJneeded=true; console.log('ajout de : ' + tokens["display-name"]);}
		}
		catch(ex) { }	 	
	}

	replace += '  </one-of>\n';
	replace += '<!-- @';
	if (MAJneeded) {
		var regexp = new RegExp('@[^@]+@','gm');
		var xml    = xml.replace(regexp,replace);
		fs.writeFileSync(file, xml, 'utf8');
	}
}

var output = function ( callback, output ) {
	console.log(output);
	callback({ 'tts' : output});
}

var calcultime = function (dateString){
var currentTime = new Date();
var properlyFormatted = currentTime.getFullYear() + ("0" + (currentTime.getMonth() + 1)).slice(-2) + ("0" + currentTime.getDate()).slice(-2);

switch (dateString)
	{
	case 'now':
		properlyFormatted = properlyFormatted + ("0" + (currentTime.getHours() + 1)).slice(-2) + ("0" + (currentTime.getMinutes() + 1)).slice(-2) + ("0" + (currentTime.getSeconds() + 1)).slice(-2) ;
	break;
	case 'evening':
		properlyFormatted = properlyFormatted + "210000" ; // tous les programmes du soir commencent avant 21heures
	break;
	default:
	 }
return properlyFormatted
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

exports.cron = function (callback, task) {
	var userkey = task.kazeruserkey;
	var http = require('http'),
	fs = require('fs');
	var file = fs.createWriteStream(__dirname + "/tvguide.xml");
	var req = http.get("http://www.kazer.org/tvguide.xml?u=" + userkey, function(res) {
		res.pipe(file);
		console.log("fichier xml recuperer");
	});
	
}
