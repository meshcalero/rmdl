var assert = require('assert');

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
		throw new Error("conflicting specifications for module "+spec.name+", version "+spec._version);
	}
	mod[spec._version] = spec;
	return spec;
};

Ast.prototype.ensureModule = function(moduleId){
	if( this.modules[moduleId] ) return this.ast[moduleId];
	return this.modules[moduleId] = {};
}

Ast.prototype.processModel = function(){
	return this;
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

/*
RmdlAst.prototype.processModule = function(mod){
	var moduleId ="#"+mod.name;
	var version = mod.properties.version || "0";
	
	var newSpec = {
		_module : mod,
		_path : [ moduleId, version ],
		name: mod.name,
		document: "file:"+filename,
		types: {},
		dependencies: {}
	};
	
	this.addModuleSpecification(
		this.ensureModule(moduleId),
		version,
		newSpec
	);
	mod.dependencies.forEach(
		function(dependency){
			this.processModuleDependency(dependency,newSpec)
		}
		,this
	);
	mod.types.forEach(
		function(type){ 
			this.processType(type,newSpec)
		}, 
		this
	);
	if( mod.moduleType == "resource" ){
		if( mod.baseType.params.length > 0 ){
			newSpec.resourceType = this.generateAnonymousType( mod.baseType, newSpec )
		}
		else {
			newSpec.resourceType = this.resolveTypeReference( mod.baseType, newSpec );
		}
	}
	console.log(newSpec);
} */

ModuleSpec.prototype.addDependency = function(dependencyDecl){
	return new DependencySpec(dependencyDecl,this);
}

var DependencyDecl = function(uri,properties){
	this.uri = uri,
	this.properties = properties ? properties : {};
}

var DependencySpec = function(dependencyDecl,module){
	this._module = module;
	this._decl = dependencyDecl;
}

ModuleSpec.prototype.addType = function(typeDecl){
	return new TypeSpec(typeDecl,this);
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

RmdlAst = function(){
	this.ast = {
		generator: "rmdc.js",
		version: "0",
		date: (new Date()).toISOString(),
		modules: {}
	};
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
	
RmdlAst.prototype.processModuleDependency = function(dependency,moduleSpec){
	var fragmentStart = dependency.uri.indexOf("#");
	if( fragmentStart < 0 ){
		throw new Error("missing fragment in dependency uri \'"+dependency.uri+"\'");
	}
	var version = orDefault( dependency.properties.version, "0" );
	var localName = orDefault( dependency.properties.localName, dependency.uri.substring(fragmentStart+1) );
	var newDependency = [ dependency.uri, version ];
	
	this.addModuleDependency(newDependency,localName,moduleSpec)
	
	console.log(newDependency);
}

RmdlAst.prototype.addModuleDependency = function(dependency,localName,moduleSpec){
	if( moduleSpec.dependencies === undefined ) {
		moduleSpec.dependencies = {}
	}
	if( moduleSpec.dependencies[localName] !== undefined ){
		throw new Error("conflicting name '"+localName+"' for dependencies:\n- "+dependency.uri+"\n- "+moduleSpec.dependencies[localName][0]);
	}
	moduleSpec.dependencies[localName] = dependency;
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
module.exports.TypeDecl = TypeDecl;
module.exports.ElementDecl = ElementDecl;
