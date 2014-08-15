HAL
-----

The module HAL contains a RMDL specification for resources with embedded hypertext control based on the [Hypertext Application Language (HAL) specification](http://tools.ietf.org/html/draft-kelly-json-hal-06#section-4.1.1).


### ResourceObject

ResourceObject is the base type for all HAL resource models. It contains two predefined elements containing hypertext links of the given resource and embedded resources. Derived resource models may add additional elements to specify the state of the resource.

#### _links : Dictionary[ keyType:RelType, valueType:OneOrMany[t:LinkObject] ]
For each link relation the `_links` dictionary contains one or many link entries
#### _embedded : Dictionary[ keyType:RelType, valueType:OneOrMany[t:ResourceObject] ]
For each embedded resource there exists an entry in a dictionary which uses the relation type of the embedded resource to the surrounding resource as key. The value can be one or many ResourceObjects

### RelType : String[minLength:1]

HAL introduces for Link relation types an extended representation of [RFC 5988](http://tools.ietf.org/html/rfc5988):

* Registered link relation types use their registered string 

* Custom link relation types should be (HTTP) URI, which should point to HTML documentation for that relation type. 

* The reserved (but unregistered) relation type `curies` can get used for a compact URI representation in [CURIE Syntax](http://www.w3.org/TR/2010/NOTE-curie-20101216/) for custom link relation types. 

In the following example the short notation `acme:widgets` refers to the URI `http://docs.acme.com/relations/widgets`

	   {
	     "_links": {
	       "self": { "href": "/orders" },
	       "curies": [{
	         "name": "acme",
	         "href": "http://docs.acme.com/relations/{rel}",
	         "templated": true
	       }],
	       "acme:widgets": { "href": "/widgets" }
	     }
	   }


### LinkObject (final:true)
A LinkObject specifies a link to a target resource. 

#### href : HREF (required:true)
The link URI or URI template
#### templated : Boolean (default:false)
Indicates if the `href` attribute contains a URI Template
#### type : String
Gives a hint on the expected media type of the target resource
#### deprecation : Boolean (default:false)
Indicates that the link is deprecated
#### name : String
A secondary key for selecting one out of multiple links
#### profile: String
A URI providing a hint about the [profile](http://tools.ietf.org/html/draft-wilde-profile-link-04) of the target resource
#### title: String
A label for the link
#### hreflang : String
A [BCP 47](http://tools.ietf.org/html/bcp47) language tag identifying the language of the target resource

### OneOrMany : Choice

The generic type OneOrMany allows to model a data type that either contains a single entry of a given type or a collection of elements of the same type.

##### t : Type
The base type of a OneOrMany model

#### one : t
The single entry
#### many : Collection[ type:t, minSize:1 ]
The many entries; at least one
 