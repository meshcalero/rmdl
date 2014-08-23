var assert = require('assert');

var RMDL_VERSION = "0";
var CORE_MODULE_ID = "#Core";

function orDefault(value,def){
	return ( value == null ? def : value )
}

function existsAndNonEmpty(arr){
	return arr != null && arr.length > 0;
}

function paramsToString(params){
	if( !params || params.length <= 0 ) return "";
	var p = {};
	this.params.forEach(function(kv){
		if(kv.itemType=="keyValue"){
			p[kv.key] = kv.value;
		}
		else {
			p[kv.key.toString()] = null;
		}
	});
	var pString = "";
	Object.keys(p).forEach(function(k){
		var v=p[k];
		if( v==null ){
			pString+=k+",";
		}
		else {
			pString+=k+":"+v+","
		}
	});
	return "["+pString.substring(0,pString.length-1)+"]"
}
	
var Ast = function(filename){
	this._documents = [ "file:"+filename ];
	this.generator = "rmdc.js";
	this.version = RMDL_VERSION;
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
	if( this.modules[moduleId] ) return this.modules[moduleId];
	return this.modules[moduleId] = {};
}

Ast.prototype.iterateModuleSpecs = function(fn){
	for( var v in this.modules ){
		var version = this.modules[v];
		for( var moduleId in version ){
			var modSpec = version[moduleId];
			fn(modSpec);
		}
	}
}

Ast.prototype.iterateTypes = function(fn){
	this.iterateModuleSpecs( function(modSpec) {
		modSpec.iterateTypes(fn);
	});
}

Ast.prototype.processModel = function(){

	this.iterateModuleSpecs(function(modSpec){
		modSpec.processTypeRefs();
	});
	
	this.iterateTypes(function(type){
		type.resolveBase();
	});

	this.iterateModuleSpecs(function(modSpec){
		modSpec.processParameterValues();
	});

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

Ast.prototype.getTypeByTypeReference = function(typeRef){
	return this.getModuleVersion(typeRef).getTypeByTypeReference(typeRef);
}

function isPredefinedType( typeName ){
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
		case "Link":
		case "PaginateableCollection":
			return true;
		default:
			return false;
	}
}

var predefinedProperties = {
	"default" : 		[CORE_MODULE_ID, RMDL_VERSION, "DefaultValue"],
	"required": 		[CORE_MODULE_ID, RMDL_VERSION, "Boolean"],
	"usage": 			[CORE_MODULE_ID, RMDL_VERSION, "Usage"],
	"readOnly": 		[CORE_MODULE_ID, RMDL_VERSION, "Boolean"],
	"writeOnly": 		[CORE_MODULE_ID, RMDL_VERSION, "Boolean"],
	"final": 			[CORE_MODULE_ID, RMDL_VERSION, "Boolean"],
	"named": 			[CORE_MODULE_ID, RMDL_VERSION, "Boolean"],
	"version":			[CORE_MODULE_ID, RMDL_VERSION, "Integer"]
};

function isPredefinedProperty( typeName ){
	return predefinedProperties[typeName] != null;
}

var TypedItemDecl = function(name,typeRef,properties){
	this.name = name;
	this.typeRef = typeRef;
	this.properties = orDefault( properties, {} );
};

TypedItemDecl.prototype.typeString = function(){
	if( !this.typeRef.name ) return "(untyped)";
	return this.typeRef.toString();
}

TypedItemDecl.prototype.hasTypeParams = function(){
	return this.typeRef.hasParams();
}

var ModuleSpec = function(moduleDecl,ast){
	this._ast = ast;
	this._decl = moduleDecl;
	this._version = moduleDecl.properties.version || "0";
	this._id = "#"+moduleDecl.name;
	this._path = [ this._id, this._version ];
	
	this.name = this._decl.name;
	this.properties = moduleDecl.properties;
	this.types = {};
	this.dependencies = {};
}

ModuleSpec.prototype.processTypeRefs = function(){
	this.resourceType = this.resolveTypeReference(this._decl.typeRef);
	this.iterateTypes( function(t){
		t.processTypeRefs();
	} );
}

ModuleSpec.prototype.iterateTypes = function(fn){
	for( var t in this.types ){
		fn(this.types[t])
	}
}

ModuleSpec.prototype.resolveTypeReference = function(typeRef){
	var type = this.resolveType(typeRef);
	return type == undefined ? undefined : type.getSelfReference();
}

ModuleSpec.prototype.resolveType = function(typeRef){
	if( typeRef != null ){
		//console.log(typeRef);
		var type = this.getVerifiedType(typeRef.qual, typeRef.name);
		if( type.hasParams() ){
		/*
			create anonymous type
		*/
		}
		return type;
	}
	else {
		return undefined;
	}
}

ModuleSpec.prototype.processParameterValues = function(){
}

/*
ModuleSpec.prototype.getAnonymousParametrizedType = function(typeRef){
	var qualName = typeRef.qual ? typeRef.qual+"."+typeRef.name : typeRef.name;
	var anonymousId = qualName+"["+this.paramsHash(typeRef)+"]";
	if( this.types[anonymousId] ) {
		return this.types[anonymousId];
	}
	var newType = new TypeSpec(
		new ItemDecl(undefined,new Reference(qualName)),
		this
	);
	newType.parent = this.getVerifiedType(typeRef.qual, typeRef.name);
	newType._path = this.getSelfReference().concat([anonymousId]);
	this.types[anonymousId] = newType;
	return newType.getSelfReference();
}

ModuleSpec.prototype.paramsHash = function( typeRef ){
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
*/
ModuleSpec.prototype.addDependency = function(dependencyDecl){
	var fragmentStart = dependencyDecl.uri.indexOf("#");
	if( fragmentStart < 0 ){
		throw new Error("missing fragment in dependency uri \'"+dependencyDecl.uri+"\'");
	}
	var version = orDefault( dependencyDecl.properties.version, RMDL_VERSION );
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

ModuleSpec.prototype.getVerifiedType = function(localName,typeName){
	//console.log(localName + "::" +typeName );
	var referencedVersion = localName == null 
		? this.types[typeName] == null ? this._ast.getModuleVersion([CORE_MODULE_ID,RMDL_VERSION]) : this
		: this.resolveModuleByLocalName(localName);
	var referencedType = referencedVersion.types[typeName];
	if( referencedType == undefined ) {
		console.log(referencedVersion);
		throw new Error("could not resolve type \""+typeName+"\"");
	}
	return referencedType;

}

ModuleSpec.prototype.resolveModuleByLocalName = function(localName){
	var dep = this.dependencies[localName];
	if( dep === undefined ){
		throw new Error("could not resolve local module name \""+localName+"\"");
	}
	return this._ast.getModuleVersion(dep);
}
	
ModuleSpec.prototype.addType = function(typeDecl){
	var newType = new TypeSpec(typeDecl,this);
	if( this.types[newType.name] ) {
		throw new Error("conflicting type an for module "+newType.name+", version "+version);
	}
	this.types[newType.name] = newType;
	return newType;
}

ModuleSpec.prototype.getTypeByTypeReference = function(typeRef){
	var type = this.types[typeRef[2]]
	if( type == null ) {
		throw new Error("could not resolve type \""+typeRef[2]+"\" in version \""+moduleRef[1]+"\" of module \""+moduleRef[0]+"\"");
	}
	return type;
}


var DependencyDecl = function(uri,properties){
	this.uri = uri,
	this.properties = orDefault( properties, {} );
}

var TypeSpec = function(typeDecl,module){
	this._module = module;
	this._decl = typeDecl;
	this.name = this._decl.name;
	this._path = module.getSelfReference().concat([this.name]);
	this.properties = typeDecl.properties;
}

TypeSpec.prototype.processTypeRefs = function(){
	var parentDecl = orDefault( this._decl.typeRef, RECORD );
	
	if( this.hasParams() ){
		for( pName in this.typeParams ){
			this.typeParams[pName].processTypeRefs();
		}
	}
	
	// skip all basetypes;
	//console.log(parentDecl);
	if( parentDecl.qual == null && parentDecl.name == "Type" ) {
		//console.log("got new base type :"+this.name);
		this.base = this.name;
		return;
	}
	
	this.parent = this._module.resolveTypeReference(parentDecl);
	
	if( this.hasExtensions() ) {
		this.extensions.forEach(function(ext){
			if( typeof ext != "string" ){
				ext.processTypeRefs();
			}
		});
	}
}

TypeSpec.prototype.resolveBase = function(){
	if( this.base == null ) {
		var parentType = this._module._ast.getTypeByTypeReference(this.parent);
		//console.log(parentType.name);
		this.base = parentType.resolveBase();
	}
	return this.base;
}

TypeSpec.prototype.getSelfReference = function(){
	return this._path;
}

TypeSpec.prototype.addParam = function(paramDecl){
	if( this.typeParams == null ){
		this.typeParams = {};
	}
	var p = new ParameterDecl(paramDecl, this);
	this.typeParams[p.name] = p;
	return p;
}

TypeSpec.prototype.hasParams = function(){
	return this.typeParams != null && Object.keys(this.typeParams).length > 0;
}

TypeSpec.prototype.addExtension = function(extensionDecl){
	if( this.extensions == null ){
		this.extensions = [];
	}
	var newExt = extensionDecl.typeRef 
		? new AdditionalElement(extensionDecl,this) 
		: extensionDecl.name;
	this.extensions.push(newExt);
	return newExt;
}

TypeSpec.prototype.hasExtensions = function(){
	return existsAndNonEmpty( this.extensions );
}


var ParameterDecl = function(paramDecl,type){
	this._type = type;
	this._decl = paramDecl;
	this.name = paramDecl.name;
	this.properties = paramDecl.properties;
}

ParameterDecl.prototype.processTypeRefs = function(){
	this.type = this._type._module.resolveTypeReference(this._decl.typeRef);
}

var AdditionalElement = function(extensionDecl,type){
	this._type = type;
	this._decl = extensionDecl;
	this.name = extensionDecl.name ? extensionDecl.name : extensionDecl.typeRef.toString();
	this.properties = extensionDecl.properties;
}

AdditionalElement.prototype.processTypeRefs = function(){
	this.type = this._type._module.resolveTypeReference(this._decl.typeRef);
}

var Reference = function(name,params){
	var lastDot = name.lastIndexOf(".");
	this.qual = lastDot<0 ? null : name.substring(0,lastDot);
	this.name = lastDot<0 ? name : name.substring(lastDot+1);
	this.params = params;
}

Reference.prototype.toString = function(){
	var result = this.qual ? this.qual + this.name : this.name;
	return result + paramsToString( this.params );
}

Reference.prototype.hasParams = function(){
	return this.params != null && this.params.length > 0;
}

var RECORD = new Reference("Record");

var Properties = function(keyValues){
	keyValues.forEach(function(kv){
		if( kv.value == null ){
			kv.value = { valueType: 'boolean', value: true }
		}
		this[kv.key] = kv.value;
	}
	,this
	);
}

module.exports.Ast = Ast;
module.exports.TypedItemDecl = TypedItemDecl;
module.exports.DependencyDecl = DependencyDecl;
module.exports.Reference = Reference;
module.exports.Properties = Properties;