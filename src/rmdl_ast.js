var assert = require('assert');
var pointer = require('json-pointer');

var RMDL_VERSION = "0";
var CORE_MODULE_ID = "#Core";

/*
 * Some helper functions
 * ----
 */
 
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

function stringify(o){
	return JSON.stringify(
			o
			,function(key,value){
				if( key.indexOf('_')==0 ) return undefined;
				if( key == "properties" ){
					for( var p in value ){
						if( p.indexOf('_')!=0 )return value;
					}
					return undefined;
				}
				return value;
			}
			,2
	)
}

/*
 * Reference
 * ----
 * A parser object representing a reference to some other RDML entity in a RMDL file
 * References hold a qualified identifier, and in case of references to type entities,
 * may in addition have type parameters
 */
 
var Reference = function(name,params){
	var lastDot = name.lastIndexOf(".");
	this.qual = lastDot<0 ? null : name.substring(0,lastDot);
	this.name = lastDot<0 ? name : name.substring(lastDot+1);
	this.params = params;
}

Reference.prototype.toString = function(){
	var result = this.qual ? this.qual + "." + this.name : this.name;
	return result + paramsToString( this.params );
}

Reference.prototype.hasParams = function(){
	return this.params != null && this.params.length > 0;
}

var RECORD = new Reference("Record"); // the default value for the super type of new types
var IDENTIFIER = new Reference("Identifier"); // the (implicit) type for enum extensions

/*
 * TypedItemDecl
 * ---
 * A parser object representing a RMDL declaration line, comprising of 
 * - a (unqualified) name, 
 * - a reference to some type entity
 * - a property list
 * None of those elements is required, but it depends on the RMDL entity type that gets declared,
 * which of the elements are optional
 */
 
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

/*
 * DependencyDecl
 * ----
 * A parser object representing a dependency from one module to another module
 */
var DependencyDecl = function(uri,properties){
	this.uri = uri;
	this.properties = this.properties = orDefault( properties, {} );
}

/*
 * Properties
 * ----
 * A parser object representing a sequence of (qualified) name / value pairs.
 * A property that contains only a name corresponds to a value true.
 * Although a object created by the parser it also becomes part of the 
 * resulting syntax tree.
 */

 
 // The properties predefined in RMDL are declared in the Properties type in the RMDL Core model.
 var PROPERTIES_REF = [CORE_MODULE_ID,RMDL_VERSION,"Properties"];

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

// associates a parser's Properties object with the AST entity it is assigned to.
Properties.associate = function (properties,entity,entityType){
	properties = orDefault(properties, {});
	properties._for = new TypedReference( entityType, entity );
	entity.properties = properties;
}

Properties.prototype.parent = function(){
	return this._for.follow();
}


/*
 * TypedReference
 * ----
 * A generic helper object for references between entities of a MSDN document
 * It has two primary responsibilities:
 * - Providing information about the type of object it is referring to
 * - During JSON serialization provide a "json-pointer" referring to the referenced object,
 *   as JSON can't hold cyclic references.
 */
 
var TYPE = {
	AST: 0,
	MODULE: 1,
	DEPENDENCY: 2,
	TYPE: 3,
	PARAM : 4,
	EXTENSION: 5
};

var TypedReference = function(type,obj){
	this.type = type;
	this.obj = obj;
}

TypedReference.prototype.follow = function(){
	return this.obj;
}

TypedReference.prototype.toJSON = function(){
	return this.obj.getSelfReference();
}

/*
 * Ast -- Abstract Syntax Tree
 * ----
 * The root object for the generated compiler output
 */

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

	this._coreProperties = this.getTypeByTypeReference(PROPERTIES_REF);
	
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

Ast.prototype.simplifyProperties = function(properties){
	function wrongTypeError(pname,pvalue,pexpType,pcurrType){
		throw new Error( 
			"Property \""
			+pname
			+"\" requires value of type \""
			+pexpType
			+"\" but got \""
			+pvalue
			+"\" ("
			+pcurrType
			+")"
		);
	}
	
	function wrongReferenceTypeError(pname,ref,pexpType,pcurrType){
		throw new Error( 
			"Property \""
			+pname
			+"\" requires value of type \""
			+pexpType
			+"\" but referenced object \""
			+ref.follow().name
			+"\" got type \""
			+pcurrType
		);
	}
	
	function wrongReferenceError(pname,ref,pexpType){
		throw new Error( 
			"Property \""
			+pname
			+"\" requires value of type \""
			+pexpType
			+"\" but referenced object \""
			+ref.follow().name
			+"\" can't provide such a value"
		);
	}
	
	function invalidRefError(pname,pexpType,ref){
		throw new Error( 
			"Property \""
			+pname
			+"\" requires value of type \""
			+pexpType
			+"\" but referenced object \""
			+(ref||"null").toString()
			+"\" could not get resolved"
		);
	}
	
	function simplifySimpleProperty(propName, prop, propDecl, propType, ref, expectedValueType){
		if( prop.valueType == expectedValueType ){
			properties[propName]=prop.value;
		}
		else if( prop.valueType == "reference" ){
			if( ref == null ){
				invalidRefError(propName,propType.name,prop.value);
			}
			else if( ref.type == TYPE.PARAM && ref.follow().type.base == propType.base ){
				properties[propName]=ref;
			}
			else {
				wrongReferenceTypeError(propName, ref, propType.base, prop.ref.type.base);
			}
		}
		else {
			wrongTypeError(propName, prop.value, propType.base, prop.valueType);
		}	
	}
	
	//console.log(stringify(properties));
	
	for( var propName in properties ){
		if( !properties.hasOwnProperty(propName) || propName.charAt(0)=="_") continue;
		var prop = properties[propName];
		var propDecl = this._coreProperties.findExtension(propName);
		if( propDecl != undefined ){
			var propType = propName == "default" ? properties.parent().type.follow() : propDecl.type.follow();
			var ref = prop.valueType == "reference" ? properties.parent().searchReference(prop.value) : null;
			//console.log(stringify(propType));
			switch( propType.base ){
				case "Boolean":
					simplifySimpleProperty(propName, prop, propDecl, propType, ref, "boolean");
					break;
				case "String":
					simplifySimpleProperty(propName, prop, propDecl, propType, ref, "string");
					break;
				case "Number":
					simplifySimpleProperty(propName, prop, propDecl, propType, ref, "number");
					break;
				case "Integer":
					simplifySimpleProperty(propName, prop, propDecl, propType, ref, "number");
					if( typeof properties[propName] == "number" ){
						properties[propName] = properties[propName].toFixed();
					}
					break;
				case "Enum":
					if( prop.valueType == "reference" ){
						if( propType.findExtension(prop.value.name) != undefined ){
							// name of enum item
							properties[propName]=prop.value.name;
						}
						else if( ref == null ){
							// unresolved reference
							invalidRefError(propName,propType.name,prop.value);
						}
						else if( ref.type == TYPE.PARAM && ref.follow().type.base == propType.base ){
							// name of a param with same enum type
							properties[propName]=ref;
						}
						else if( ref.type == TYPE.EXTENSION && ref.follow()._type.base == propType.base ){
							// qualified name of a enum type item
							if( propType.findExtension(ref.follow().name) != undefined ){
								properties[propName]=ref.follow().name;
							}
							else {
								wrongReferenceTypeError( propName, ref, propType.name, prop.ref.follow().type.name );
							}
						}
						else {
							wrongReferenceError( propName, ref, propType.name );
						}
					}
					else {
						wrongTypeError(propName, prop.value, propType.name, prop.valueType);
					}
					break;
				case "Type":
					if( ref == null ){
						// unresolved reference
						invalidRefError(propName,propType.name,prop.value);
					}
					else if( ref.type != TYPE.TYPE ){
						wrongReferenceError( propName, ref, propType.name );
					}
					else {
						properties[propName] = { type: ref };
					}
					break;
				default:
					console.warn("unexpected property type \""+propType.base+"\"");
			}
		}
		else {
			console.log("unknown property name \""+propName+"\"");
		}
	}
}

Ast.prototype.toString = function(){
	return stringify(this);
}

/*
 * ModuleSpec:
 * -----
 * Holds the specification of a single module
 */
 
var ModuleSpec = function(moduleDecl,ast){
	this._ast = ast;
	this._decl = moduleDecl;
	this._version = moduleDecl.properties.version || "0";
	this._id = "#"+moduleDecl.name;
	this._path = pointer.compile( [ "modules", this._id, this._version ] );
	
	this.name = this._decl.name;
	Properties.associate( moduleDecl.properties, this, TYPE.MODULE );
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
	return type == undefined ? undefined : new TypedReference( TYPE.TYPE, type );
}

ModuleSpec.prototype.resolveType = function(typeRef){
	if( typeRef != null ){
		//console.log(typeRef);
		var type = this.getVerifiedType(typeRef.qual, typeRef.name);
		if( type.hasParams() ){
		/*
			TODO:create anonymous type
		*/
		}
		return type;
	}
	else {
		return undefined;
	}
}

ModuleSpec.prototype.processParameterValues = function(){
	this._ast.simplifyProperties(this.properties);
	this.iterateTypes(function(t){
		t.processParameterValues();
	});
}

ModuleSpec.prototype.searchReference = function(ref){
	if( ref.qual == null ){
		// local reference must be a module type
		var type = this.types[ref.name];
		return type != null ? new TypedReference( TYPE.TYPE, type ) : null;
	}
	else {
		var modSpec = this.dependencies[ref.qual];
		if( modSpec == null ) return null;
		return modSpec.searchReference( new Reference(ref.name, ref.params) );
	}
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
	//TODO: build correct version check; this one fails, when a version is specified
	var version = orDefault( dependencyDecl.properties.version, RMDL_VERSION );
	//TODO: build correct localName check; this one fails, when a localName is specified
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

/*
 * TypeSpec:
 * -----
 * Holds the specification of a RMDL type
 */
 
var TypeSpec = function(typeDecl,module){
	this._module = module;
	this._decl = typeDecl;
	this.name = this._decl.name;
	this._path = module.getSelfReference()+pointer.compile( ["types", this.name] );
	Properties.associate( typeDecl.properties, this, TYPE.TYPE );
}

TypeSpec.prototype.processTypeRefs = function(){
	var parentDecl = orDefault( this._decl.typeRef, RECORD );
	
	for( var pName in this.typeParams ){
		this.typeParams[pName].processTypeRefs();
	}
	
	// skip all basetypes;
	//console.log(parentDecl);
	if( parentDecl.qual == null && parentDecl.name == "Root" ) {
		//console.log("got new base type :"+this.name);
		this.base = this.name;
		return;
	}
	
	this.parent = this._module.resolveTypeReference(parentDecl);
	
	for( var eName in this.extensions ){
		this.extensions[eName].processTypeRefs();
	}
}

TypeSpec.prototype.searchReference = function(ref){
	if( ref.qual == null ){
		// either a type param or another object in the same module
		var param = this.hasParams() ? this.typeParams[ref.name] : null;
		return param != null 
			? new TypedReference( TYPE.PARAM, param ) 
			: this._module.searchReference(ref);
	}
	else {
		return this._module.searchReference(ref);
	}
}

TypeSpec.prototype.resolveBase = function(){
	if( this.base == null ) {
		this.base = this.parent.follow().resolveBase();
	}
	return this.base;
}

TypeSpec.prototype.getSelfReference = function(){
	return this._path;
}

TypeSpec.prototype.processParameterValues = function(){
	this._module._ast.simplifyProperties(this.properties);
	for( pName in this.typeParams ){
		this._module._ast.simplifyProperties(this.typeParams[pName].properties);
	};
	for( eName in this.extensions ){
		this._module._ast.simplifyProperties(this.extensions[eName].properties);
	}
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
		this.extensions = {};
	}
	var newExt = new AdditionalElement(extensionDecl,this);
	var extId = newExt.name != null ? newExt.name : extensionDecl.typeRef.toString();
	this.extensions[extId] = newExt;
	return newExt;
}

TypeSpec.prototype.hasExtensions = function(){
	return this.extensions != null && Object.keys(this.extensions).length > 0;
}

// searches in this type and its super types for a given extension name
TypeSpec.prototype.findExtension = function(name){
	//console.log(stringify(this.extensions));
	var result = this.hasExtensions() ? this.extensions[name] : null;
	return result != null
		? result
		: this.base != this.parent.follow().name
			? this.parent.follow().findExtension(name)
			: undefined;
}

/*
 * ParameterDecl
 * ------
 * Holds the declaration of a parameter of a given type
 */
 
var ParameterDecl = function(paramDecl,type){
	this._type = type;
	this._decl = paramDecl;
	this._decl.typeRef = orDefault(this._decl.typeRef, IDENTIFIER);
	
	this.name = paramDecl.name;
	Properties.associate( paramDecl.properties, this, TYPE.PARAM );
}

ParameterDecl.prototype.processTypeRefs = function(){
	this.type = this._type._module.resolveTypeReference(this._decl.typeRef);
}

ParameterDecl.prototype.searchReference = function(ref){
	return this._type.searchReference(ref);
}

ParameterDecl.prototype.getSelfReference = function(){
	return this._type.getSelfReference()+pointer.compile(["typeParams",this.name]);
}

/*
 * AdditionalElement
 * ------
 * Holds the declaration of an element of a given type
 */

var AdditionalElement = function(extensionDecl,type){
	this._type = type;
	this._decl = extensionDecl;
	this.name = extensionDecl.name; // || "anonymous";
	Properties.associate( extensionDecl.properties, this, TYPE.EXTENSION );
}

AdditionalElement.prototype.processTypeRefs = function(){
	this.type = this._type._module.resolveTypeReference(this._decl.typeRef);
}

AdditionalElement.prototype.searchReference = function(ref){
	return this._type.searchReference(ref);
}

AdditionalElement.prototype.getSelfReference = function(){
	// due to a strange behaviour in JSON.stringify we must ensure that we would create a reference
	// string also for unnamed strings, even when they get never rendered, as the serialization 
	// seems to happen before the JSON serialization filter can prevent the JSON from being rendered.
	// So I must pass an "anonymous" string for unnamed elements to the json-pointer compiler
	return this._type.getSelfReference()+pointer.compile(["extensions",(this.name||"anonymous")]);}



module.exports.Ast = Ast;
module.exports.TypedItemDecl = TypedItemDecl;
module.exports.DependencyDecl = DependencyDecl;
module.exports.Reference = Reference;
module.exports.Properties = Properties;