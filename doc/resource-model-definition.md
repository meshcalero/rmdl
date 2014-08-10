Resource Model Definition Language
===

Resource Model Definition Languages (RMDL) provides a specification language for conceptual data models used within web service API. The language has three primary purposes:

* Writing a documentation for the given data model
* Enable a tool chain for the creation of bindings of that specification into various serialization formats (JSON, XML) and languages (both schema languages as well as programming languages)
* Provide means to version RMDL models and verify their structural compatibility 

Check the [Future extensions]() section for others features that may come. 

Other than most schema languages RMDL focuses on the documentation of a model, and therefore uses a text processing centric approach rather than a programming language / formal specification approach. To achieve that goal, RDML adopts the idea of [RAML](http://raml.org/) or [apiblueprint](http://apiblueprint.org/) to data modeling: Built upon [Markdown](http://daringfireball.net/projects/markdown/) RDML adds some conventions on top of the basic Markdown syntax. By using Markdown RDML allows data modelers to use any text editor to write RMDL specifications.

RMDL models don't specify any physical format directly. A RMDL compiler is expected to translate the human-readable RMDL model into a machine-readable abstract syntax tree, which other tools can then use to generate the physical schema. Through that separation RMDL can avoid much of the complexity of other attempts to address that problem, like [DFDL](http://en.wikipedia.org/wiki/Data_Format_Description_Language)

RMDL Example
----

A simple RMDL example specifying a structured representation of a geocoordinate:

	Geo
	-----
	The package Geo contains data models for geographic objects

	###GeoCoordinate
	
	A location on earth specified by means of latitude, longitude and elevation.

	#### latitiude : Number[min:-90.0,max:90.0] (required)
	The [latitude](http://en.wikipedia.org/wiki/Latitude) of a location on earth by means of [WGS84](http://en.wikipedia.org/wiki/World_Geodetic_System)
	
	#### longitude : Number[min:-180.0,max:180.0] (required)
	The [longitude](http://en.wikipedia.org/wiki/Longitude) of a location on earth by means of [WGS84](http://en.wikipedia.org/wiki/World_Geodetic_System)	
	
	#### altitude : Number
	The elevation of a location on earth by means of meters above sea-level

This RMDL specification describes a data structure `GeoCoordinate` within a package `Geo` that contains the three elements `latitude`, `longitude` and `altitude` as floating point values. `longitude` and `latitude` are required elements and come with restrictions in the value range, while `altitude` is as optional element (default behavior in RMDL) without any range restriction.

RMDL Meta Model
-----

RMDL has six basic meta model elements to specify a data model:

* package: A group of data models sharing a common domain 
* dependencies: The dependency of one package to other packages or versions of packages.
* type: An individual data model specification
* element: A sub-component of a type
* parameters: Information that all allows to derive a specific type from a generic type definition
* properties: Predefined specification elements that allow to provide additional meta information on specific model elements

RMDL Format
----

RMDL uses Markdown as underlying syntax. On top of plain Markdown RMDL comes with a predefined semantic for specific Markdown heading types that start the specification of a specific model element:

* heading 1 (reserved)
* heading 2 specifies packages
* heading 3 specifies types
* heading 4 specifies type elements
* heading 5 specifies parameters or dependencies

As properties are predefined, there is no need to introduce new properties.

For each of the headings a special syntax in defined that allows to give a structured specification of the relationships between the various elements of a model specification:

### Packages

A package specification starts with a heading 1 line that uses the following format:

	packageName : primaryType[typeParam:value,...] (property:value,...)

The line may contain the following elements:

* The first token is an identifier for the new type
* If the package specifies a `primaryType`, the package specifies a resource model and `primaryType ` (and the corresponding type parameters) specifies the Type that is uses for the resource's representation.


### Types 

A type specification starts with a heading 2 line that uses the following format:

	typeName[typeParam,...] : parentType[typeParam:value,...] (property:value,...)

The line may contain the following elements:

* The first token is an identifier for the new type
* If the new type is a generic type, the identifier is followed by a declaration of names of required type parameters of the new type in square brackets. A name followed by a plus character `+` indicates that the there can be multiple parameters with that name.
* The parent type is specified after a colon. If not specified the parent type is the RMDL standard type `Record`.
* If the parent type is a generic type, the type parameter values for the parent type follow in square brackets
* Property values for the new type are listed within parenthesis

### Elements

The specification of each individual element is listed below the type specification it belongs to and starts with a heading 3 line that uses the following format:

	element : type[typeParam:value,...] (property:value,...)

The line may contain the following elements:

* The first token is an identifier for the new element
* A colon precedes the type of the element
* If the element type is a generic type, the type parameter values for the parent type follow in square brackets
* Property values for the new element are listed within parenthesis

### Type Parameters

Type parameters specifications use the same format as elements; the only difference is that type parameters use heading 4 instead of heading 3. 

Type parameters of a type are specified directly after the type definition and before the first element of the type.

### Dependencies

The specification of the dependencies of a package is listed below the package specification it belongs to. It starts with a heading 4 line that use the following syntax

	"packageURI" (property:value,...)

Each dependency line contains the following elements:

* A URI pointing to a package in some RMDL resource. The name of the package must follow the document's URI as URI fragment. Local package references just use `#packageName`
* The most important property is the version of the package this package refers to.

### Properties

Available properties are predefined, either globally by RMDL directly or by certain tool chains that operate on RMDL specifications. In order to avoid naming conflicts between various tool chains, property identifiers are namespaced and use a dot-notation `namespace.property`. 

Property values can only be scalar types (strings, number, boolean). 

Property identifiers without namespace prefix refer to RMDL properties:

#### default: DefaultValue
Specifies for elements and type parameters the default value that is used in case the parameter or property is not explicitly set. 

#### required: Boolean (default:false)
Specifies if an element is a required element

#### usage: Usage (default:out)
Specifies the intended usage of a given type. Based on that property the corresponding compatibility for a given type get 

#### final: Boolean (default:false)
Specifies if subsequent versions of a given type definition will never add additional elements to the type

#### named: Boolean (default:false)
Specifies if compatibility checks shall not only check if for structural compatibility, but also for the usage of the same type

#### version: Integer (default:0)
Specifies the major version number for a resource model (used for both, package declaration and dependencies specification)

#### localName: String
Used on dependencies. Allows the definition of a unique local name for a dependent package, if a package has dependencies to multiple packages in distinct RMDL files that have the same name. This local name is then used as prefix when referring to types of the given package. 

### Values

Scalar type values used in a RMDL specification support [JSON notation](http://www.json.org/) for the equivalent value type. 

Instead of a value, you can also specify the name of a type parameter, if that parameter has the same type.

RMDL supports a short representation for Boolean values: If a parameter or property requires a boolean value, just specifying the name of the parameter/property `x` is equivalent to writing `x:true`

RDML Core Types
----

The RMDL core types are described in a [RDML Specification](../models/core.rdm).

Compatibility
------

WIP

Future Extensions
-----

This first version of RMDL focuses on the definition of individual resources and building a tool chain for verification, compatibility-checks and serialization format generators.

Versions will extend RDML with a hypertext control model, that allows not only the structure of a data model of a resource, but also describe resource models for hypertext based API. 

Three exist also early ideas to combine multiple RMDL models into one API model and then being able to provide compatibility checks for a API as a whole. 