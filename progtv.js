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
	case 'category':
	get_programme(findcategory, data, callback, config );
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

	fs.readFile(__dirname + '/tvguide.tv', function(err, dataxml) {
		parser.parseString(dataxml, function (err, result) {
				updatechannels(result.tv.channel, data, callback, config);
				updatecategory(result.tv.programme, data, callback, config);
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
						if (trouve('numjour', data.day, programme.$.stop.substring(0,8),"")){
						console.log(trouve('time', "", programme.$.stop.substring(0,8), timevalue));
							if (parseInt(trouve('time', "", programme.$.stop.substring(0,8), timevalue)) < parseInt(programme.$.stop.substring(0,14)) && parseInt(trouve('time', "", programme.$.start.substring(0,8), timevalue)) > parseInt(programme.$.start.substring(0,14))){
								parle +=  trouve('nomjour', '',programme.$.start.substring(0,8),'') + " sur " + convertChannelName(tokens, result, data, callback, config) + " a " + programme.$.start.substring(8,10) + ":" + programme.$.start.substring(10,12) + ", " + programme.category[0]._ + ", " + programme.title + ". ";
							}
						}
					}
				}
					
						
			}
			
		}
		output (callback, parle);
}

var liste = function ( result, data, callback, config) {
console.log("***** recuperation des listes programmes *****");
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
							parle += " " + programme.category[0]._ +  " sur " + convertChannelName(tokens, result, data, callback, config) + " a " + programme.$.start.substring(8,10) + ":" + programme.$.start.substring(10,12) + ", " + programme.title + " .";
						}
					}
			
				}
					
			output (callback, parle);			

}

var findcategory = function ( result, data, callback, config) {
console.log("***** recherche des categories *****");
var parle ="";
	if (!data.time){ 
		var timevalue = "now"; 
	}else{
		var timevalue = data.time;
	}
	
	if (data.channel){ 
		parle += "chaine " + convertChannelName(data.channel, result, data, callback, config) + " categorie " + data.category;
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
			
		

var updatechannels = function (programme, data, callback, config){
console.log("***** update channels *****");

	var fs   = require('fs');
	var file = data.directory + '/../plugins/progtv/progtv.xml';
	var xml  = fs.readFileSync(file,'utf8');
  
	var replace  = '@ -->\n';
	replace += '  <one-of>\n';
	MAJneeded=false;
	for ( var i = 0; i < programme.length; i++ ) {
		var tokens = programme[i];
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

var updatecategory = function (programme, data, callback, config){
console.log("***** update category *****");

	var fs   = require('fs');
	var file = data.directory + '/../plugins/progtv/progtv.xml';
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
			console.log('ajout de : ' + tokens.category[0]._);
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
	console.log("erreur dans fonction trouve");
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
	
	var options = {
  host: 'www.kazer.org',
  port: 80,
  path: '/tvguide.xml?u=' + userkey
};

http.get(options, function(res) {
  console.log("Got response: " + res.statusCode);

  res.on("data", function(chunk) {
		var file = fs.createWriteStream(__dirname + "/tvguide.tv");
		res.pipe(file);
		console.log("fichier tvguide.tv recuperer");
  });
}).on('error', function(e) {
	console.log("Erreur: " + e.message);
	console.log("fichier tvguide.tv non mis a jour");
});
	
}