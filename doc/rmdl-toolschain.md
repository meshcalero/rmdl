RMDL Toolchain
====

The RMDL toolchain operates on the output of a RMDL compiler, called a `RMDL Abstract Syntax Tree (AST)`

This AST provides a complete, machine readable representation the resource model as described by the RMD document given to the compiler.

The AST is based on a 3-level hierarchy of nested dictionaries to a resource model:

* On the first level we have a dictionaries of modules
* The second level contains all the versions of each module
* The third level then lists the typed declared within one version of a module

The individual type declarations then uses references to other types available within the AST to describe the various relationships amongst types. Those references use a triple of strings that describe the path through the nested dictionaries to the referenced type.

While the identifiers used as keys in the dictionaries are derived from the names of their corresponding objects, they are not the same. The RMDL compiler must ensure that they correctly and uniquely identify the module and therefor might have to generate arbitrary identifiers.

Tools processing a AST must be aware of two special cases:

- The compiler might have to generate anonymous types for elements using parametrized types. Those types will *not* contain a name attribute
- For references to RMDL core or hypertext types, the AST will use "core" and "hyper" as module identifiers and the version of the RMDL specification used by the compiler. The corresponding types will not be part of the generated AST. It is expected that tools know the semantics of those types. 

The detailed [RMDL AST model is available as RMDL specification](../models/RMDL_AST.rmd.md).

RMDL AST Examples
----

### Gists

A description of a simple Gist API based on the [Gist API example in API blueprint](https://github.com/apiaryio/api-blueprint/tree/resource-blueprint#gist-resource):
	
	GIST API : Gists
	====
	
	The GIST API provides two resource types:
	
	* Gists: A collection of hyperlinks to Gist resources
	* Gist: An individual Gist resource
	
	Gists : GistModel
	------
	The resource Gists models a collection of hyperlinks to Gist resources
	
	##### "#Gist"
	It depends on the resource model for an individual Gist
	
	### GistsModel
	
	#### self : Link[]
	#### search : Link[accept:GistSearch]
	#### list : Link[]
	#### create : Link[type:Gist,method:POST,type:Gist]
	#### total : Integer[min:0]
	#### items : GistLinkCollection
	
	### GistLinkCollection : PaginateableCollection[type:GistLink]
	### GistLink:Link[type:Gist]
	#### descriptionTeaser : String
	
	### GistSearch
	This data model describes the parameters for the search link
	#### searchBy: String
	#### searchByAttribute: String
	
	Gist : GistModel
	------
	The resource Gist models an individual Gist resource
	
	### GistModel (usage:inOut)
	#### self : Link[]
	#### edit : Link[method:PUT]
	#### delete : Link[method:DELETE]
	#### archive : Link[type:none,method:POST]
	#### restore : Link[type:none,method:POST]
	#### id: Integer (readOnly)
	#### status: GistStatus (readOnly)
	#### description: String
	#### content: String
	
	### GistStatus : Enum
	#### active
	#### archived

The corresponding ASST could look like that:



	{
		"generator" : "rmdc.js",
		"version" : "0",
		"date" : "2014-05-08T03:13:12Z",
		"name" : "GIST API",
		"modules" : {
			"#Gists":{
				"0" : {
					"name": "Gists",
					"document": "file:./Gist.rmd.md",
					"dependencies": {
						"Gist" : ["#Gist","0"]
					},
					"types":{
						"GistsModel":{
							"name": "GistsModel",
							"parent": ["core",0,"Record"],
							"base": "Record",
							"extensions": [{
								"name": "self",
								"type": ["hyper","0","Link"]
							},{
								"name": "search",
								"type": ["#Gists","0","Link[accepts:GistSearch]"]
							},{
							
							},{
								"name": "items",
								"type": ["#Gists","0","GistLinkCollection"]
							}]
						},
						"GistLinkCollection":{
							"name": "GistLinkCollection",
							"parent": ["#Gists","0","PaginateableCollection[type:GistLink]"],
							"base": "Record"
						},
						"GistSearch":{
							"name": "GistSearch",
							"parent": ["core",0,"Record"],
							"base": "Record",
							"extensions": [{
								"name": "searchBy",
								"type": ["core","0","String"]
							},{
								"name": "GistSearch",
								"type": ["core","0","String"]
							}]
						},
						"Link[accept:GistSearch]":{
							"parent" : ["hyper","0","Link"],
							"parentParams" : {
								"accept": { "typeRef" : ["#Gists","0","GistSearch"] }
							}
						},
						"PaginateableCollection[type:GistLink]": {
							"parent": ["hyper","0","PaginateableCollection"],
							"parentParams" : {
								"accept": { "typeRef" : ["#Gists","0","GistLink"] }
							}
						}
					},
					"resourceType" : ["#Gists",0,"GistsModel"]
				}
			},
			"#Gist":{
				"0" : {
					"name": "Gist",
					"document": "file:./Gist.rmd.md",
					"types":{
						"GistModel":{
							"name": "GistModel",
							"parent": ["core",0,"Record"],
							"base": "Record",
							"extensions": [{
								"name": "self",
								"type": ["hyper","0","Link"]
							},{
								"name": "edit",
								"type": ["anonymous","0","Link[method:PUT]"]
							},{
							
							},{
								"name": "id",
								"type": ["core","0","Integer"],
								"properties": {
									"readOnly" : { "value" : true }
								}
							},{
							
							}]
						},
						"GistStatus":{
							"name": "GistStatus",
							"parent": ["core",0,"Enum"],
							"base": "Enum",
							"extensions": [	"active", "archived" ]
						}
					},
					"resourceType" : ["#Gists",0,"GistModel"]
				}
			}
		},
		"index": ["#Gists",0,"GistsModel"]
	}
