Resource Model Definition Language
===

Resource Model Definition Languages (RMDL) provides a specification language for conceptual data models used within web service API. The language has three primary purposes:

* Writing a documentation for the given data model
* Enable a tool chain for the creation of bindings of that specification into various serialization formats (JSON, XML) and languages (both schema languages as well as programming languages)
* Provide means to version RMDL models and verify their structural compatibility 

Check the [Future extensions](#future_extensions) section for others features that may come. 

Other than most schema languages RMDL focuses on the documentation of a model, and therefore uses a text processing centric approach rather than a programming language / formal specification approach. To achieve that goal, RDML adopts the idea of [RAML](http://raml.org/) or [apiblueprint](http://apiblueprint.org/) to data modeling: Built upon [Markdown](http://daringfireball.net/projects/markdown/) RDML adds some conventions on top of the basic Markdown syntax. By using Markdown RDML allows data modelers to use any text editor to write RMDL specifications.

RMDL models don't specify any physical format directly. A RMDL compiler is expected to translate the human-readable RMDL model into a machine-readable abstract syntax tree, which other tools can then use to generate the physical schema. Through that separation RMDL can avoid much of the complexity of other attempts to address that problem, like [DFDL](http://en.wikipedia.org/wiki/Data_Format_Description_Language)

RMDL Example
----

A simple RMDL example specifies a structured representation of a geocoordinate:

	Geo
	-----
	The package Geo contains data models for geo-spatial data

	###GeoCoordinate
	
	A location on earth specified by means of latitude, longitude and elevation.

	#### latitude : Number[min:-90.0,max:90.0] (required)
	The [latitude](http://en.wikipedia.org/wiki/Latitude) of a location 
	on earth by means of [WGS84](http://en.wikipedia.org/wiki/World_Geodetic_System)
	#### longitude : Number[min:-180.0,max:180.0] (required)
	The [longitude](http://en.wikipedia.org/wiki/Longitude) of a location on earth 
	by means of [WGS84](http://en.wikipedia.org/wiki/World_Geodetic_System)	
	#### altitude : Number
	The elevation of a location on earth by means of meters above sea-level

This RMDL specification describes a data structure `GeoCoordinate` within a package `Geo` that contains the three elements `latitude`, `longitude` and `altitude` as floating point values. `longitude` and `latitude` are required elements and come with restrictions in the value range, while `altitude` is as optional element (default behavior in RMDL) without any range restriction.

A RMDL to json-schema generator could then generate the following JSON schema from that spec

	{
	    "$schema": "http://json-schema.org/draft-04/schema#",
		"title": "Geo",
		"description": "The package Geo contains data models for geo-spatial data"
		"definitions": {
			"GeoCoordinate": {
			    "description": "A location on earth specified by means of latitude, longitude and elevation.",
			    "type": "object",
			    "properties": {
			        "latitude": {
			            "description": "The latitude of a location on earth by means of WGS84",
			            "type": "number",
						"minimum": -90.0,
						"maximum": 90.0
			        },
			        "longitude": {
			            "description": "The longitude of a location on earth by means of WGS84",
			            "type": "number",
						"minimum": -180.0,
						"maximum": 180.0
			        },
			        "altitude": {
						"description": "The elevation of a location on earth by means of meters above sea-level",
			            "type": "number"
			        },
			    },
			    "required": ["latitude", "longitude"]
			}
		}
	} 

A RMDL to XML Schema generator would instead create a XML Schema from the same model:

	<?xml version="1.0"?>
	<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
		<xs:annotation>
		  <xs:appinfo>Geo</xs:appinfo>
		  <xs:documentation xml:lang="en">
		  The package Geo contains data models for geo-spatial data
		  </xs:documentation>
		</xs:annotation>
		<complexType name="GeoCoordinate">
			<xs:annotation>
			  <xs:documentation xml:lang="en">
			  A location on earth specified by means of latitude, longitude and elevation.
			  </xs:documentation>
			</xs:annotation>
			<xs:sequence>
				<xs:element name="latitude">
					<xs:annotation>
					  <xs:documentation xml:lang="en">
					  The latitude of a location on earth by means of WGS84
					  </xs:documentation>
					</xs:annotation>
					<xs:simpleType>
						<xs:restriction base="xs:double">
							<xs:minInclusive value="-90.0"/>
							<xs:maxInclusive value="90.0"/>
						</xs:restriction>
					</xs:simpleType>
				</xs:element>
				<xs:element name="longitude">
					<xs:annotation>
					  <xs:documentation xml:lang="en">
					  The longitude of a location on earth by means of WGS84
					  </xs:documentation>
					</xs:annotation>
					<xs:simpleType>
						<xs:restriction base="xs:double">
							<xs:minInclusive value="-180.0"/>
							<xs:maxInclusive value="180.0"/>
						</xs:restriction>
					</xs:simpleType>
				</xs:element>
				<element name="altitude" type="xs:double" minOccurs="0">
					<xs:annotation>
					  <xs:documentation xml:lang="en">
					  The elevation of a location on earth by means of meters above sea-level
					  </xs:documentation>
					</xs:annotation>
				</xs:element>
 				<xs:any minOccurs="0"/>
			</xs:sequence>
		</complexType>
	</xs:schema>

It is worth to mention that this XML Schema is not fully compliant to the RMDL model, as RMDL records are by default *extensible* (unless explicitly restricted by a `final` property) and *unordered*. This allows that a instance of a resource is still compatible to the RMDL model if it contains additional elements or the elements are ordered differently. XML Schema doesn't support the combination of both properties in any simple way. For sake of readability of this example we're showing a XML Schema that has given up the *unordered* property of RMDL.

And a RMDL to Protocol Buffers generator would create the following serialization specification:

	/* The package Geo contains data models for geo-spatial data
	 */
	package Geo;

	/* A location on earth specified by means of latitude, longitude and elevation.
	 */
	messsage GeoCoordinate {
		/* The latitude of a location on earth by means of WGS84
		*/
		required double latitude = 1;		
		/* The longitude of a location on earth by means of WGS84
		*/
		required double longitude = 2;		
		/* The elevation of a location on earth by means of meters above sea-level
		*/
		optional double altitude = 3;
	}

The Protocol Buffer example illustrates, that RMDL can't guarantee that all schema languages for serialization formats support all features of the RMDL specification. Here we are missing for example the range constraints for the various elements. Closing those gaps would in that case then be the responsibility of the (ideally also generated) binding code for a given programming language to the protocol buffers interfaces.

RMDL Meta Model
-----

RMDL has six basic meta model elements to specify a data model:

* module: A group of data models sharing a common domain 
* dependencies: The dependency of one package to other packages or versions of packages.
* type: An individual data model specification
* element: A sub-component of a type
* parameters: Information that all allows to derive a specific type from a generic type definition
* properties: Predefined specification elements that allow to provide additional meta information on specific model elements

RMDL Format
----

RMDL uses Markdown as underlying syntax. On top of plain Markdown RMDL comes with a predefined semantic for specific Markdown heading types that start the specification of a specific model element:

* heading 1 specifies an API
* heading 2 specifies modules
* heading 3 specifies types
* heading 4 specifies type elements
* heading 5 specifies parameters or dependencies

As properties are predefined, there is no need to introduce new properties within a RMDL specification.

For each of the headings a special syntax in defined that allows to give a structured specification of the relationships between the various elements of a model specification:


### API

An API specification starts with a heading 1 line that uses the following format:

	moduleName : primaryType[typeParam:value,...] (property:value,...)

The line may contain the following elements:

* The first token is an identifier for the module
* If the package specifies a `primaryType`, the module specifies a resource model and `primaryType ` (and the corresponding type parameters) specifies the Type that is uses for the resource's representation.

### Modules

A module specification starts with a heading 2 line that uses the following format:

	moduleName : primaryType[typeParam:value,...] (property:value,...)

The line may contain the following elements:

* The first token is an identifier for the module
* If the package specifies a `primaryType`, the module specifies a resource model and `primaryType ` (and the corresponding type parameters) specifies the Type that is uses for the resource's representation.


### Types 

A type specification starts with a heading 3 line that uses the following format:

	typeName[typeParam,...] : parentType[typeParam:value,...] (property:value,...)

The line may contain the following elements:

* The first token is an identifier for the new type
* If the new type is a generic type, the identifier is followed by a declaration of names of required type parameters of the new type in square brackets. A name followed by a plus character `+` indicates that the there can be multiple parameters with that name.
* The parent type is specified after a colon. If not specified the parent type is the RMDL standard type `Record`.
* If the parent type is a generic type, the type parameter values for the parent type follow in square brackets
* Property values for the new type are listed within parenthesis

### Elements

The specification of each individual element is listed below the type specification it belongs to and starts with a heading 4 line that uses the following format:

	element : type[typeParam:value,...] (property:value,...)

The line may contain the following elements:

* The first token is an identifier for the new element
* A colon precedes the type of the element
* If the element type is a generic type, the type parameter values for the parent type follow in square brackets
* Property values for the new element are listed within parenthesis

### Type Parameters

Type parameters specifications use the same format as elements; the only difference is that type parameters use heading 5 instead of heading 4. 

Type parameters of a type are specified directly after the type definition and before the first element of the type.

### Dependencies

The specification of the dependencies of a package is listed below the package specification it belongs to. It starts with a heading 4 line that use the following syntax

	[moduleName](moduleUri) (property:value,...)

Each dependency line contains the following elements:

* A URI pointing to a module in some RMDL specification document. The name of the module must follow the document's URI as URI fragment. Local module references just use `#moduleName`, which is also the default value, in case the moduleUri string is empty.
* If a module has dependencies to two RMDL documents containing the same name, an alias name allows to give the two modules two distinct names. 
* The most important property is the version of the package this package refers to.

Some examples:

* `[Example](#Example)` - refers to the module `Example` in the same RMDL document
* `[Example]()` - short notation for the above
* `[Example](http://example.com/rmdf#Example)` - refers to the module `Example` in the external document with URI `http://example.com/rmdf`
* `[Alias](http://example.com/rmdf#Example)` - refers to the module `Example` in the external document with URI `http://example.com/rmdf`
### Properties

Available properties are predefined, either globally by RMDL directly or by certain tool chains that operate on RMDL specifications. In order to avoid naming conflicts between various tool chains, property identifiers are namespaced and use a dot-notation `namespace.property`. 

Property values can only be scalar types (strings, number, boolean). 

Property identifiers without namespace prefix refer to RMDL properties:

* `default: DefaultValue`

	Specifies for elements and type parameters the default value that is used in case the parameter or property is not explicitly set. 

* `required: Boolean (default:false)`

	Specifies if an element is a required element

* `usage: Usage (default:out)`

	Specifies the intended usage of a given type. Based on that property the corresponding compatibility for a given type get

* `readOnly: Boolean (default: false)`

	Specifies for types with `usage:inOut` that a specific element definition is only valid for response representations. 

	A given element can not contain have both properties readOnly and writeOnly set to true. But a type may contain two equally named element

* `writeOnly: Boolean (default: false)`

	Specifies for types with `usage:inOut` that a specific element definition is only valid for request representations.

	A given element can not contain have both properties readOnly and writeOnly set to true. But a type may contain two equally named element

* `final: Boolean (default:false)`

	Specifies if subsequent versions of a given type definition will never add additional elements to the type

* `named: Boolean (default:false)`

	Specifies if compatibility checks shall not only check if for structural compatibility, but also for the usage of the same type

* `version: Integer (default:0)`

	Specifies the major version number for a resource model (used for both, package declaration and dependencies specification)


### Values

Scalar type values used in a RMDL specification support [JSON notation](http://www.json.org/) for the equivalent value type. 

Instead of a value, you can also specify the name of a type parameter, if that parameter has the same type.

RMDL supports a short representation for Boolean values: If a parameter or property requires a boolean value, just specifying the name of the parameter/property `x` is equivalent to writing `x:true`

RMDL Core Types
----

The RMDL core types are described in a [RDML Specification](../models/core.rmd.md).

Versioning & Compatibility
------

Resource Models change as as API evolves. The RMDL specification defines extensibility rules for each RMDL Core Type and the intended usage. Based on those rules it is possible to build an automated compatibility check that allows to process two versions of RMDL specification document and check them for compatibility along the
A RMDL model assigns a version number to each module. If a module has no explicit version assigned, this indicates that the module

<a name="future_extensions"></a>Future Extensions
-----

This first version of RMDL focuses on the definition of individual resources and building a tool chain for verification, compatibility-checks and serialization format generators.

Versions will extend RMDL with a hypertext control model, that allows not only the structure of a data model of a resource, but also describe resource models for hypertext based API. 

There exist also early ideas to combine multiple RMDL models into a single API model and then being able to provide compatibility checks for an API as a whole.

