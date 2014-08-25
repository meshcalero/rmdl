// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
  console.log('Usage: node ' + process.argv[1] + ' FILENAME');
  process.exit(1);
}

var assert = require('assert');
var Parser = require('../lib/rmdp.js').Parser;
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

var filename = require('path').resolve(process.argv[2]);

ResourceModelState = function(){
	this.currModule = null;
	this.currType = null;
	this.state = this.states.START;
}

ResourceModelState.prototype.states={
	START:0,
	MODULE:1,
	DEPENDENCY:2,
	TYPE:3,
	PARAM:4,
	EXTENSION:5
};

ResourceModelState.prototype.validTransitions=[
	[false, true,  false, false, false, false],
	[false, true,  true,  true,  false, false],
	[false, true,  true,  true,  false, false],
	[false, true,  false, true,  true,  true ],
	[false, true,  false, true,  true,  true ],
	[false, true,  false, true,  false, true ]
];

ResourceModelState.prototype.nextState = function(newState){
	if(!this.validTransitions[this.state,newState]){
		throw new Error( "Unexpected transition from state "+this.state+" to "+newState );
	}
	this.state = newState;
}

ResourceModelState.prototype.startModule = function(module){
	this.currModule = module;
	this.currType = null;
}

ResourceModelState.prototype.startType = function(type){
	this.currType = type;
}

var state = new ResourceModelState();
var Ast = require("../src/rmdl_ast.js").Ast;
var ast = new Ast(filename);

assert(ast,"Failed to instantiate AST");


var marked = require('marked');

var rmdlRenderer = new marked.Renderer();

rmdlRenderer.heading = function(text,level,raw){
	var line = text.replace(/\&quot;/g,'"');
	switch(level){
		case 2: 
			state.nextState(state.states.MODULE);
			state.startModule(
				ast.addModule(
					parser.parse("MODULE "+line)
			)	);
			break;
		case 3:
			state.nextState(state.states.TYPE);
			state.startType(
				state.currModule.addType(
					parser.parse("TYPE "+line)
			)	);
			break;
		case 4:
			state.nextState(state.states.EXTENSION);
			state.currType.addExtension(
				parser.parse("EXTENSION "+line)
			);
			break;
		case 5: 
			if(state.state == state.states.MODULE || state.state == state.states.DEPENDENCY){
				state.nextState(state.states.DEPENDENCY);
				state.currModule.addDependency(
					parser.parse("DEPENDENCY "+line)
				);
			}
			else {
				state.nextState(state.states.PARAM);
				state.currType.addParam(
					parser.parse("PARAM "+line)
				);
			}
			break;
	}
	return marked.Renderer.prototype.heading.call(this,text,level,raw);
}

rmdlRenderer.listitem = function(text){
	//console.log("new list-item:\n");
	//console.log(text);
}

var tokWrapper = function() {
  //console.log("got token type: "+this.token.type);
  return marked.Parser.prototype.tok.call(this);
}

var content = "";
for( var i=2; i< process.argv.length; i++) {
	content += fs.readFileSync(process.argv[i], 'utf8') + "\n"
};
//console.log(content);
processRmdl(content);

function processRmdl(rmdlString){
	var options = { renderer: rmdlRenderer };
	var lexer = new marked.Lexer(options);
	var parser = new marked.Parser(options);
	parser.tok = tokWrapper;


	var tokens = lexer.lex(rmdlString);
	var html = parser.parse(tokens);
	ast.processModel();
	console.log( ast.toString() );
}

