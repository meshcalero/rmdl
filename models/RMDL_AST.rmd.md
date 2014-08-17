
RMDL_AST : Ast
---------
This module specifies the resource model of a RMDL abstract syntax tree (AST).

The RMDL_AST is the output of a RMDL compiler when compiling an RMDL based API specification

### Ast
* generator : String `"rmdc.js v1.0"` 		- The name of the RMDL compiler
* version : Version `"0"` 					- The version of the RMDL_AST specification 
* date : DateTime `"2013-05-08T03:13:12Z"`	- The date of the compilation
* name : Identifier `"Gist API"`			- The API name
* modules : Dictionary[ModuleId,Module] 	- All modules used in that API
* index : TypeReference 					- The type containing the resource model for the API index


### ModuleId : Uri
### Module : Dictionary[ModuleVersionNumber,ModuleSpec]
### ModuleReference : NTuple

A module reference is a compound key of a module's identifier and the referenced version

* ModuleId									- The document URI followed by a module name fragment
* ModuleVersionNumber						- The version of the referenced module 

### TypeReference : ModuleReference

A type reference extends a module reference with the referenced type's identifier

* TypeId

### ModuleVersionNumber : Version

### ModuleSpec
Specifies a module and all types specified within that module

* name : ModuleName 						- The name of the module
* document : Uri 							- The URI of the document containing the module specification
* dependencies : Dictionary[Alias,ModuleReference] - The dependencies of the module to other modules
* types : Dictionary[TypeId,TypeSpec] 	- The types specified in that module
* resourceType : TypeReference 				- When the module describes a resource, the type of the resource

### ModuleName : Identifier
### Alias : Identifier
### TypeId : Identifier

### TypeSpec
* name : TypeName							- The name of the type, unless anonymous
* typeParams : TypeParameters				- The parameters of this type
* parent : TypeReference					- The parent type of the type
* parentParams : ParentParameters			- The values provided to the parent type
* base : RmdlBaseType						- What is the root type of that type
* extensions : TypeExtensions				- How does this type extend the parent type
* properties : Properties					- the properties of that element

### TypeName : Identifier
### TypeParameters : Dictionary[Identifier, ParameterDecl]
### ParentParameters : Dictionary[Identifier, ParameterValue]
### TypeExtensions: Choice
* AdditionalElements
* AdditionalEnums

### ParameterDecl
* name : Identifier
* type : TypeReference
* properties : Properties

### ParameterValue : Choice (named)

The value passed to a parameter of a type can be either a scalar value, a reference to some other type or a reference to a parameter in the context 

* value : ScalarValue
* typeRef : TypeReference
* paramRef : Identifier

### AdditionalElements : Sequence[AdditionalElement]
### AdditionalEnums : Sequence[Identifier]

### AdditionalElement

* name : Identifier							- The name of the additional element, unless unnamed
* type : TypeReference						- The type of the additional element
* value : String							- A string representation of an example a value
* properties : Properties					- The properties of that element

### Properties : Dictionary[NamespacedIdentifier, ParameterValue]

### DateTime : String
A [RFC 3339](http://tools.ietf.org/html/rfc3339#section-5.6) compliant data-time string

### Version : String [pattern:"\\d+(\\.\\d+)*"]
A dot-separated sequence of numbers

### Identifier : String

### NamespacedIdentifier : String

### Uri : String
A [RFC 2396](http://tools.ietf.org/html/rfc2396) compliant URI string