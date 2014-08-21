var assert = require('assert');

function orDefault(value,def){
	return ( value == undefined ? def : value )
}

var Ast = function(filename){
	this._documents = [ "file:"+filename ];
	this.generator = "rmdc.js";
	this.version = "0";
	this.date = (new Date()).toISOString();
	this.modules = {};
};

Ast.prototype.addModule = function(moduleDecl){
	var spec = new ModuleSpec(moduleDecl,this);
	var mod = this.ensureModule(spec._id);
	if( mod[spec._version] ) {
		throw new Error("Conflicting specifications for module "+spec.name+", version "+spec._version);
	}
	mod[spec._version] = spec;
	return spec;
};

Ast.prototype.ensureModule = function(moduleId){
	if( this.modules[moduleId] ) return this.ast[moduleId];
	return this.modules[moduleId] = {};
}

Ast.prototype.processModel = function(){
	for( var v in this.modules ){
		var version = this.modules[v];
		for( var moduleId in version ){
			var modSpec = version[moduleId];
			modSpec.process();
		}
	}
	return this;
}

Ast.prototype.getModuleVersion = function(moduleRef){
	var referencedModule = this.modules[moduleRef[0]];
	if( referencedModule === undefined ) {
		throw new Error("could not resolve module reference \""+moduleRef[0]+"\"");
	}
	var referencedVersion = referencedModule[moduleRef[1]];
	if( referencedVersion == undefined ) {
		throw new Error("could not resolve version \""+moduleRef[1]+"\" of module \""+moduleRef[0]+"\"");
	}
	return referencedVersion;
}

var ModuleDecl = function(name,resourceType,properties){
	this.name = name;
	this.resourceType = resourceType;
	this.properties = properties ? properties : {};
};

var ModuleSpec = function(moduleDecl,ast){
	this._ast = ast;
	this._decl = moduleDecl;
	this._version = moduleDecl.properties.version || "0";
	this._id = "#"+moduleDecl.name;
	this._path = [ this._id, this._version ];
	
	this.name = this._decl.name;
	this.types = {};
	this.dependencies = {};
}

ModuleSpec.prototype.process = function(){
	this.resolveResourceType();
	for( var t in this.types ){
		this.types[t].process();
	}
}

ModuleSpec.prototype.resolveResourceType = function(){
	var typeRef = this._decl.resourceType;
	if( typeRef !== undefined ){
		if( typeRef.params !== undefined ){
			console.log(JSON.stringify(typeRef));
			throw new Error("not yet implemented: parametrized parent types");
		}
		else {
			this.resourceType = this.getVerifiedTypeReference(typeRef.qual, typeRef.name);
		}
	}
}

ModuleSpec.prototype.addDependency = function(dependencyDecl){
	var fragmentStart = dependencyDecl.uri.indexOf("#");
	if( fragmentStart < 0 ){
		throw new Error("missing fragment in dependency uri \'"+dependencyDecl.uri+"\'");
	}
	var version = orDefault( dependencyDecl.properties.version, "0" );
	var localName = orDefault( dependencyDecl.properties.localName, dependencyDecl.uri.substring(fragmentStart+1) );
	if( this.dependencies[localName] !== undefined ){
		throw new Error(
			"conflicting name '"
			+localName
			+"' for dependencies:\n- "
			+dependencyDecl.uri
			+"\n- "
			+moduleSpec.dependencies[localName][0]
		);	
	};
	var newDependency = [ dependencyDecl.uri, version ];
	this.dependencies[localName] = newDependency;
	return newDependency;
}

ModuleSpec.prototype.getSelfReference = function(){
	return this._path;
}

ModuleSpec.prototype.getVerifiedTypeReference = function(localName,typeName){
	var referencedVersion = localName == null ? this : resolveModuleByLocalName(localName);
	var referencedType = referencedVersion.types[typeName];
	if( referencedType == undefined ) {
		console.log(referencedVersion);
		throw new Error("could not resolve type \""+typeName+"\"");
	}
	return referencedType.getSelfReference();

}

ModuleSpec.prototype.resolveModuleByLocalName = function(localName){
	var dep = this.dependencies[localName];
	if( dep === undefined ){
		throw new Error("could not resolve local module name \""+localName+"\"");
	}
	return this._ast.getModuleVersion(dep);
}
	
var DependencyDecl = function(uri,properties){
	this.uri = uri,
	this.properties = properties ? properties : {};
}

ModuleSpec.prototype.addType = function(typeDecl){
	var newType = new TypeSpec(typeDecl,this);
	if( this.types[newType.name] ) {
		throw new Error("conflicting type an for module "+newType.name+", version "+version);
	}
	this.types[newType.name] = newType;
	return newType;
}

var TypeDecl = function(name,parentType,properties){
	this.name = name;
	this.parentTypeDecl = parentType ? "RECORD" : parentType;
	this.properties = properties ? properties : {};
}

var TypeSpec = function(typeDecl,module){
	this._module = module;
	this._decl = typeDecl;
	this.name = this._decl.name;
	this._path = module.getSelfReference().concat([this.name]);
}

TypeSpec.prototype.process = function(){
}

TypeSpec.prototype.getSelfReference = function(){
	return this._path;
}

TypeSpec.prototype.addElement = function(elementDecl){
	return new ElementSpec(elementDecl,this);
}

var ElementDecl = function(name,typeReference,properties){
	this.name = name;
	this.typeReference = typeReference ? "IDENTIFIER" : typeReference;
	this.properties = properties ? properties : {};
}

var ElementSpec = function(elementDecl,type){
	this._type = type;
	this._decl = elementDecl;
}

var Reference = function(name,params){
	var lastDot = name.lastIndexOf(".");
	this.qual = lastDot<0 ? null : name.substring(0,lastDot);
	this.name = lastDot<0 ? name : name.substring(lastDot+1);
	this.params = params;
}

RmdlAst = function(){
}

RmdlAst.prototype.processModel = function(model){
	model.modules.forEach(this.processModule, this);
}



RmdlAst.prototype.generateAnonymousType = function( typeRef, moduleSpec ){
	var newType = {
		parent: this.resolveTypeReference( typeRef, moduleSpec )
	};
	var anonymousId = typeRef.name+"["+this.paramsHash(typeRef)+"]";
	if( moduleSpec.types[anonymousId] !== undefined ){
		console.log("Got duplicate reference to same anonymous type");
	}
	else {
		moduleSpec.types[anonymousId] = newType
	}
	return moduleSpec._path.concat([anonymousId]);
}

RmdlAst.prototype.paramsHash = function( typeRef ){
	var params = {};
	typeRef.params.forEach(function(keyValue){
		params[keyValue.key]=keyValue.value;
	});
	var result = ""
	Object.keys(params).sort().forEach(function(key){
		result+=key+":"+(params[key].value == null ? "null" : params[key].value.toString());
	});
	return result;
}

RmdlAst.prototype.resolveParent = function( newType, typeRef, moduleSpec ){
	newType.resourceType = this.resolveTypeReference( type.baseType, moduleSpec );
	if( newType.resourceType[0] == "core" ){
		newType.base = newType.resourceType[3];
	}
}

RmdlAst.prototype.resolveTypeReference = function( typeRef, moduleSpec ){
	if( typeRef.refType != "type" ){
		throw new Error("unexpected reference type \""+typeRef.refType+"\"when trying to resolve a TypeReference \""+typeRef.name+"\"");
	}
	var lastDot = typeRef.name.lastIndexOf(".");
	var moduleRef;
	var typeName;
	if( lastDot < 0 ){
		typeName = typeRef.name; 
		moduleRef = isCoreType( typeName ) ? ["core","0"] : moduleSpec._path;
	}
	else {
		typeName = typeRef.name.substring(lastDot+1),
		moduleRef = moduleSpec.dependencies[typeRef.substring(0,lastDot)];
		if( moduleRef == null ){
			throw new Error("could not resolve module for type reference \""+typeRef.name+"\"");
		}
	}
	return moduleRef.concat([typeName]);
}

function isCoreType( typeName ){
	switch( typeName ){
		case "Record":
		case "String":
		case "Boolean":
		case "Integer":
		case "Number":
		case "Enum":
		case "Dictionary":
		case "Collection":
		case "Choice":
		case "Type":
			return true;
		default:
			return false;
	}
}
	
RmdlAst.prototype.processType = function(type,moduleSpec){
	var newType = {
		_type : type,
		name : type.name,
	};
	this.addModuleTypeSpec(moduleSpec,type.name,newType)
	console.log(newType);
}

RmdlAst.prototype.addModuleTypeSpec = function(moduleSpec,typeName,typeSpec){
	if( moduleSpec.types[typeName] ) {
		throw new Error("conflicting type an for module "+moduleId+", version "+version);
	}
	moduleSpec.types[typeName] = typeSpec;
}


RmdlAst.prototype.getModule = function(moduleId, version){
	return this.ast.modules[moduleId][version];
}



module.exports.Ast = Ast;
module.exports.ModuleDecl = ModuleDecl;
module.exports.DependencyDecl = DependencyDecl;
module.exports.TypeDecl = TypeDecl;
module.exports.ElementDecl = ElementDecl;
module.exports.Reference = Reference;