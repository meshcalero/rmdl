GIST API : Gists
====

The GIST API provides two resource types:

* Gists: A collection of hyperlinks to Gist resources
* Gist: An individual Gist resource

Gists : GistsModel
------
The resource Gists models a collection of hyperlinks to Gist resources

##### "#Gist"
It depends on the resource model for an individual Gist

### GistsModel

#### self : Link[]
Hyperlinks are "just regular elements" with a type predefined in the HyperRMDL model.
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