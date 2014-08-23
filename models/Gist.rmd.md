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
##### "#Hyper"

### GistsModel

#### self : Hyper.Link[]
Hyperlinks are "just regular elements" with a type predefined in the HyperRMDL model.
#### search : Hyper.Link[accept:GistSearch]
#### list : Hyper.Link[]
#### create : Hyper.Link[type:Gist,method:POST,type:Gist]
#### total : Integer[min:0]
#### items : GistLinkCollection

### GistLinkCollection : Hyper.PaginateableCollection[type:GistLink]
### GistLink:Hyper.Link[type:Gist]
#### descriptionTeaser : String

### GistSearch
This data model describes the parameters for the search link
#### searchBy: String
#### searchByAttribute: String

Gist : GistModel
------
The resource Gist models an individual Gist resource
##### "#Hyper"

### GistModel (usage:inOut)
#### self : Hyper.SimpleLink
#### edit : Hyper.Link[method:PUT]
#### delete : Hyper.Link[method:DELETE]
#### archive : Hyper.Link[type:none,method:POST]
#### restore : Hyper.Link[type:none,method:POST]
#### id: Integer (readOnly)
#### status: GistStatus (readOnly)
#### description: String
#### content: String

### GistStatus : Enum
#### active
#### archived