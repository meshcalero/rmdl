// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
  console.log('Usage: node ' + process.argv[1] + ' FILENAME');
  process.exit(1);
}


var Parser = (exports.Parser !== undefined ? exports.Parser : require('../lib/rmdp.js').Parser);
var	parser = new Parser();
var http = require('http');
var fs = require('fs');

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};

ResourceModel = function(){
	this.modules = [];
	this.state = this.states.START;
}

ResourceModel.prototype.states={
	START:0,
	MODULE:1,
	DEPENDENCY:2,
	TYPE:3,
	PARAM:4,
	ELEMENT:5
};

ResourceModel.prototype.validTransitions=[
	[false, true,  false, false, false, false],
	[false, true,  true,  true,  false, false],
	[false, true,  true,  true,  false, false],
	[false, true,  false, true,  true,  true ],
	[false, true,  false, true,  true,  true ],
	[false, true,  false, true,  false, true ]
];

ResourceModel.prototype.nextState = function(newState){
	if(!this.validTransitions[this.state,newState]){
		throw "Unexpected item";
	}
	this.state = newState;
}

ResourceModel.prototype.currModule = function(){
	if (this.state == this.states.START) return null;
	return this.modules[this.modules.length-1];
}

ResourceModel.prototype.currType = function(){
	var pck = this.currModule();
	if( pck.types.length==0 ) return null;
	return pck.types[ pck.types.length-1 ];
}

ResourceModel.prototype.analyzeModel = function(){

}

// Read the file and print its contents.
var fs = require('fs');
var filename = require('path').resolve(process.argv[2]);
var rm = new ResourceModel(filename);


fs.readFile(filename, 'utf8', function(err, data) {
  if (err) throw err;
  //console.log(data);
  processRmdl(data);
});

var marked = require('marked');

var rmdlRenderer = new marked.Renderer();

rmdlRenderer.heading = function(text,level,raw){
	var line = text.replace(/\&quot;/g,'"');
	switch(level){
		case 2: 
			rm.nextState(rm.states.MODULE);
			var newModule = parser.parse("MODULE "+line);
			newModule.dependencies=[];
			newModule.types=[];
			rm.modules.push(newModule);
			break;
		case 3:
			rm.nextState(rm.states.TYPE);
			var newType = parser.parse("TYPE "+line);
			newType.params=[];
			newType.elements=[];
			rm.currModule().types.push(newType)
			break;
		case 4:
			rm.nextState(rm.states.ELEMENT);
			var newElement = parser.parse("ELEMENT "+line);
			rm.currType().elements.push(newElement);
			break;
		case 5: 
			if(rm.state == rm.states.MODULE){
				rm.nextState(rm.states.DEPENDENCY);
				var newDependency = parser.parse("DEPENDENCY "+line);
				rm.currModule().dependencies.push(newDependency);
			}
			else {
				rm.nextState(rm.states.PARAM);
				var newParam = parser.parse("PARAM "+line);
				rm.currType().params.push(newParam);
			}
			break;
	}
	return marked.Renderer.prototype.heading.call(this,text,level,raw);
}

function processRmdl(rmdlString){
	marked(rmdlString, { renderer: rmdlRenderer });
	console.log(rm);
}

