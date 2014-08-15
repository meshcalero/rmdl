Hypertext
----
This package extends the basic RMDL types with additional types for the hypertext control features of RMDL.

**This document is [WIP](http://en.wikipedia.org/wiki/Work_in_progress)**

### HyperTemplate (usage:internal)
A `HyperTemplate` specifies how to construct a hypertext control for a given link to another resource.

##### uri : UriTemplate (required)
##### method: HttpMethod (default:GET)
##### accept: AcceptedResources (default:"#none")  
##### auth: AuthSchemas

###HyperTextControl
##### template: HyperTemplate

#### href: URI (required)
A URI linking to the other API resource
#### type : URI
The resource type of the target response
#### method: HttpMethod (default: GET)
The HTTP method to be used for that hyperlink
#### accept: AcceptedResources (default: "#none")
The resource type(s) specifying the resource parameters. A resource may accept multiple resource types.
#### auth: AuthSchemas
The authentication schema(s) supported for the target resource

### HyperLink : URI
A simplified representation for a HyperTextControl when a URI is sufficient to describe the full hypertext link.

##### type: URI (default:"#implied")
The resource package the Link is pointing to. If provided the `type` attribute of the hypertext control will be derived from the type provided. If not specified, an application must analyze the specific resource type at runtime.

##### method: HttpMethod (default:GET)
The HTTP method used for the hyperlink. If provided the `method` attribute of the hypertext control will only support that method.

##### accept: AcceptStrings (default:"#none")
The list of resource package URI the target resource is accepting

### HttpMethod: Enum
An enumeration that lists all valid HTTP methods

#### OPTIONS
#### GET
#### PUT
#### DELETE
#### POST
#### PATCH

### LinkStyleEnforcement: Enum
An enumeration that for the enforcement of a specific hypertext control style

#### control
The representation enforces a `HyperTextControl` representation

#### uri
The representation enforces the `SimpleLink` representation, and the service implementation. It is considered an API design failure if such a representation is enforced but the service implementation can't fulfill the preconditions that do allow the representation. An  API implementation is supposed to fail in that case.
 
#### auto
The API implementation analyses whether a given hyperlink fulfills the preconditions for the simplified representation and 
