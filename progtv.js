exports.action = function(data, callback, config, SARAH){
	console.log('plugin progtv: ##### Programme TV #####');

var config = config.modules.progtv;	

	switch (data.request)
	{
	case 'prog':
	get_programme(prog, data, callback, config, SARAH );
	break;
	case 'liste':
	get_programme(liste, data, callback, config, SARAH );
	break;
	case 'category':
	get_programme(findcategory, data, callback, config, SARAH );
	break;
	case 'detail':
	get_programme(detail, data, callback, config, SARAH );
	break;
	case 'favoris':
	get_programme(favoris, data, callback, config, SARAH );
	break;
	default:
	output(callback, "Une erreur s'est produite: ");
	}
}

var get_programme = function (action, data, callback, config, SARAH ) {
console.log("plugin progtv: connection");
	var fs = require('fs'),
	xml2js = require('xml2js');
	var parser = new xml2js.Parser({trim: true});

	fs.readFile(__dirname + '/tvguide.tv', function(err, dataxml) {
		parser.parseString(dataxml, function (err, result) {
				action(result, data, callback, config, SARAH);	
			});
	});

	

}

var prog = function ( result, data, callback, config) {
console.log("plugin progtv: recuperation des programmes");
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
						if (trouve('numjour', data.day, programme.$.stop.substring(0,8),"")){
							if (parseInt(trouve('time', "", programme.$.stop.substring(0,8), timevalue)) < parseInt(programme.$.stop.substring(0,14)) && parseInt(trouve('time', "", programme.$.start.substring(0,8), timevalue)) > parseInt(programme.$.start.substring(0,14))){	
								var newjson={"request":{}};
									newjson.request.channel= convertChannelName(tokens, result, data, callback, config);
									newjson.request.category=programme.category[0]._;
									newjson.request.description=programme.desc;
								
								addtojson(newjson,true);
								parle +=  trouve('nomjour', '',programme.$.start.substring(0,8),'') + " sur " + convertChannelName(tokens, result, data, callback, config) + " a " + programme.$.start.substring(8,10) + ":" + programme.$.start.substring(10,12) + ", " + programme.category[0]._ + ", " + programme.title + ". ";
								//LE MESSAGE EST ENVOYE A ASKME POUR ETRE SUR QUIL NOUS CONVIENNE
								// Build URL
									var json={"request":{}};
									json.request.question= parle + 'que veux tu faire? ';
									json.request.answer=["afficher","description"];
									json.request.answervalue=['http://127.0.0.1:8080/sarah/xbmc?xbmc=music&action=tv&channelname=' + convertChannelName(tokens, result, data, callback, config) ,'http://127.0.0.1:8080/sarah/progtv?request=detail'];
									json.request.answercallback=[true,true];
									json.request.TTSanswer=["Ok.",""];
									json.request.no_answervalue="http://127.0.0.1:8888/?tts=Action annuler ...";
									json.request.recall=true;
									json.request.timeout=30;
									var url='http://127.0.0.1:8080/sarah/askme';
									var request = require('request');
									request({ 
										'uri': url,
										'method': 'POST',
										'json': json,
										'timeout': 2000,
									}, function (err, response, body){
									if (err || response.statusCode != 200) {
										callback({'tts':'error'});
										return;
									}
								});	
								callback({});
								return;
							}
						}
					}
				}
					
						
			}
			
		}		
}

var liste = function ( result, data, callback, config) {
console.log("plugin progtv: recuperation des listes programmes");
var parle =data.day;
	if (!data.time){ 
		var timevalue = "now"; 
	}else{
		var timevalue = data.time;
	}	
				for ( var i = 0; i < result.tv.programme.length; i++ ) {
					var programme = result.tv.programme[i];
					var tokens = programme.$.channel.split(' ');
					if (trouve('numjour', data.day, programme.$.stop.substring(0,8),"")){
						if (parseInt(trouve('time', "", programme.$.stop.substring(0,8), timevalue)) < parseInt(programme.$.stop.substring(0,14)) && parseInt(trouve('time', "", programme.$.start.substring(0,8), timevalue)) > parseInt(programme.$.start.substring(0,14))){
							if(data.favoris){
								if(favoris(convertChannelName(tokens, result, data, callback, config))){
									parle += " " + programme.category[0]._ +  " sur " + convertChannelName(tokens, result, data, callback, config) + " a " + programme.$.start.substring(8,10) + ":" + programme.$.start.substring(10,12) + ", " + programme.title + " .";
								}
							}else{
								parle += " " + programme.category[0]._ +  " sur " + convertChannelName(tokens, result, data, callback, config) + " a " + programme.$.start.substring(8,10) + ":" + programme.$.start.substring(10,12) + ", " + programme.title + " .";		
							}
						
						}
					}
			
				}
					
			output (callback, parle);			

}

var findcategory = function ( result, data, callback, config) {
console.log("plugin progtv: recherche des categories");
var parle ="";
	if (!data.time){ 
		var timevalue = "now"; 
	}else{
		var timevalue = data.time;
	}
		
	var text = data.category;
		for ( var i = 0; i < result.tv.programme.length; i++ ) {
			var programme = result.tv.programme[i];
			var tokens = programme.category[0]._.split(' ');	
			var found = true;
			for ( var j = 0; found && j < tokens.length ; j++ ) {
				found = new RegExp(tokens[j],'i').test(text);
			}
			if (found){
			//	if (data.channel == programme.$.channel){
				parle += " " + trouve('nomjour', '',programme.$.start.substring(0,8),'') + " a " + programme.$.start.substring(8,10) + ":" + programme.$.start.substring(10,12)  + ", " + programme.title + ".";
			//}	
		}
			}
					
	output (callback, parle);					
}
			
var detail = function (donnee, data, callback, config, SARAH){
	var fs = require('fs');
	var fileJSON =  __dirname + '/progtv.json';
	json = JSON.parse(fs.readFileSync(fileJSON,'utf8'));	
	SARAH.speak(json.AllRequest[0].request.description);	
}

function favoris(channel){
	var response = false;
	var fs = require('fs');
	var fileJSON = __dirname + '/progtv.json';
	if (fs.existsSync(fileJSON)) {json = JSON.parse(fs.readFileSync(fileJSON,'utf8'));}
		for (var i = 0; i < json.AllRequest[1].request.length; i++) {
			if (json.AllRequest[1].request[i].channel == channel){
				response = true;
			}
		}	
	return response;
}

function addtojson(request,newone){
	var fs = require('fs');
	var fileJSON = __dirname + '/progtv.json';
	// Create new request with data in order:
	var newrequest={};
	newrequest.channel="" + request.request.channel;
	newrequest.description="" + request.request.description;
	newrequest.category="" + "" + request.request.category;
	if (fs.existsSync(fileJSON)) {json = JSON.parse(fs.readFileSync(fileJSON,'utf8'));}	
			json.AllRequest.splice(0,1); 			// Delete existing request
	if (newone)	
		{json.AllRequest.unshift({"request":newrequest});}
	else		
		{json.AllRequest.push({"request":newrequest});}
	fs.writeFileSync(fileJSON, JSON.stringify(json, null, 4) , 'utf8');
} 

var updatechannels = function (programme){
console.log("plugin progtv: update channels");

	var fs   = require('fs');
	var file =  __dirname + '/progtv.xml';
	var xml  = fs.readFileSync(file,'utf8');
  
	var replace  = '@ -->\n';
	replace += '  <one-of>\n';
	MAJneeded=false;
	for ( var i = 0; i < programme.length; i++ ) {
		var tokens = programme[i];
		replace +='    <item>'+tokens["display-name"]+'<tag>out.action.channel="'+ tokens.$.id+'"</tag></item>\n';
		try {
			var regexp2 = new RegExp('<tag>out.action.channel="'+ tokens.$.id+'"</tag>','g');
			if (!xml.match(regexp2)) { MAJneeded=true; console.log('plugin progtv: ajout de ' + tokens["display-name"]);}
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
return;
}

var updatecategory = function (programme){
console.log("plugin progtv: update category");

	var fs   = require('fs');
	var file =  __dirname + '/progtv.xml';
	var xml  = fs.readFileSync(file,'utf8');
	var tempcategory = "";
	
	var replace  = 'C£ -->\n';
	replace += '  <one-of>\n';
	MAJneeded=false;
	for ( var i = 0; i < programme.length; i++ ) {
		var tokens = programme[i];
		try {
			var regexp2 = new RegExp('<tag>out.action.category="'+ tokens.category[0]._+'"</tag>','g');
			if (!xml.match(regexp2)) { 
			MAJneeded=true; 
			var regexp3 = new RegExp( tokens.category[0]._);
			if (!tempcategory.match(regexp3)) { 
			tempcategory += " " + tokens.category[0]._;
			replace +='    <item>'+tokens.category[0]._+'<tag>out.action.category="'+ tokens.category[0]._+'"</tag></item>\n';
			console.log('plugin progtv: ajout de ' + tokens.category[0]._);
			}
			}
		}
		catch(ex) { }	 	
	}

	replace += '  </one-of>\n';
	replace += '<!-- C£';
	if (MAJneeded) {
		var regexp = new RegExp('C£[^C£]+C£','gm');
		var xml    = xml.replace(regexp,replace);
		fs.writeFileSync(file, xml, 'utf8');
	}
return;
}

var output = function ( callback, output ) {
	console.log(output);
	callback({ 'tts' : output});
}

var trouve = function (action, dayvalue, dayrequest, time){
var currentdate = new Date();
var datevalue = new Date(dayrequest.substring(0,4) +"-"+dayrequest.substring(4,6)+"-"+dayrequest.substring(6,8));
var dateformatted = datevalue.getFullYear() + ("0" + (datevalue.getMonth() + 1)).slice(-2) + ("0" + datevalue.getDate()).slice(-2); 
		var json = {"days": [
			{"nom": "Dimanche", "valeur":0},
			{"nom": "Lundi", "valeur":1},
			{"nom": "Mardi", "valeur":2},
			{"nom": "Mercredi", "valeur":3},
			{"nom": "Jeudi", "valeur":4},
			{"nom": "Vendredi", "valeur":5},
			{"nom": "Samedi", "valeur":6}
			]
		};
		
if (!dayvalue){ 
		var jour_actuel = currentdate.getDay();
		var chaine_jour = Array('Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi');
		var jour_semaine = chaine_jour[jour_actuel];
		dayvalue = jour_semaine;
	}
	
switch (action)
{
	case 'time':
		switch (time)
		{
			case 'now':
				dateformatted = dateformatted + ("0" + (datevalue.getHours() + 1)).slice(-2) + ("0" + (datevalue.getMinutes() + 1)).slice(-2) + ("0" + (datevalue.getSeconds() + 1)).slice(-2) ;
			break;
			case 'evening':
				dateformatted = dateformatted + "210000" ; // tous les programmes du soir commencent avant 21heures
			break;
			default:
		}
	return dateformatted
	break;
	case 'nomjour':
		var jour_actuel = datevalue.getDay();
		var chaine_jour = Array('Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi');
		var jour_semaine = chaine_jour[jour_actuel];
		return jour_semaine;
	break;
	case 'numjour':
		var temp ="";
		var test = false;

		var jour = datevalue.getDay();
		for ( var i = 0; i < json.days.length; i++ ) {
			if (dayvalue == json.days[i].nom){
				temp = json.days[i].valeur;
			}
		}
		if (jour == temp){
			test = true;
		}
		return test;
	break;
	default:
	console.log("plugin progtv: erreur dans fonction trouve");
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

exports.cron = function (callback, task) {
	var userkey = task.kazeruserkey;
	var http = require('http'),
	fs = require('fs');
	xml2js = require('xml2js');
	
	var options = {
  host: 'www.kazer.org',
  port: 80,
  path: '/tvguide.xml?u=' + userkey
};

http.get(options, function(res) {
  if (res.statusCode == 200) {
  var file = fs.createWriteStream(__dirname + "/tvguide.tv");
		res.pipe(file);
		console.log("plugin progtv: fichier tvguide.tv recuperer");
		
  }

}).on('error', function(e) {
	console.log("plugin progtv: Erreur= " + e.message);
	console.log("plugin progtv:fichier tvguide.tv non mis a jour");
});

console.log("plugin progtv: connection");
		
		var parser = new xml2js.Parser({trim: true});

		fs.readFile(__dirname + '/tvguide.tv', function(err, dataxml) {
		parser.parseString(dataxml, function (err, result) {
			updatechannels(result.tv.channel);
			updatecategory(result.tv.programme);	
			});
	});
}