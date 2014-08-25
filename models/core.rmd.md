Core
-----

The Core module contains the base types used to specify new RMDL models, as well as types used for the predefined RMDL options.

The fundamental base types of RMDL contain:

* `Type` : The root type of all types
* `Record`: A parent type for structured types
* `Choice`:  A parent type for types with alternative representation variants
* `Enum`: A parent type for enumerable value ranges
* `String`: Character sequences
* `Integer`: Numbers without fractional component
* `Number`: Numbers with fractional component
* `Boolean`: true / false
* `Collection`: Collections 
* `Dictionary`: Collections with named indexes.

The Core package also defines the following types used for parameters of RDML types or RMDL predefined options:

* `Properties`: All predefined properties
* `Usage`: Specifies restriction on the allowed usage of a type
* `CharacterSet`: Specifies restrictions for the characters in a String
* `DefaultValue`: Used for the specification of default values

### Root : Root (usage: internal)

The internal type `Type` is the root type of all RMDL types. It is never used outside of this module.

### Type : Root

The type `Type`is used for generic type parameters that hold types.
#####base: Type
A value must have this type as ancestor.
 

### Record: Root

A `Record` type allows the composition of various named elements in a new data type. This type is the default parent type of new created types. Each element is specified in an extension section of the new type. 

### Enum: Root 

`Enum` represents a generic parent type for types with a finite enumerable set of valid values. The individual values are identifiers specified as elements of the specific `Enum` type. `Enum` elements have no type and no properties.

You could specify the `Enum` for the days of a week like that:

	DayOfWeek: Enum
	------
	A type representing the individual days of a week

	### sunday
	### monday
	### tuesday
	### wednesday
	### thursday
	### friday
	### saturday 

### Choice: Root

A Choice type that can hold **one of** multiple alternative types. The individual alternatives are specified as elements of the Choice. 

##### named: Boolean (default:false)
Indicates if the model contains the name of the element that is actually contained in an instance of the type

### Boolean: Root
A boolean value


### Integer: Root
Any number that doesn't require a fractional component. Two parameters allow to restrict the value range of a specific Integer type instance. If not given no assumption on the possible value range should be made, although specific implementations will come with one. Without knowledge of specific implementation data modelers may assume that ever implementation can at least handle 32 bit integer values. 

##### min: Integer
The smallest valid integer value for a specific instance of the Integer type. 

##### max: Integer
The biggest valid integer value for a specific instance of the Integer type

### Number: Root
Any numeric value. Parameters allow to restrict the value range of a specific Number type instance. 

If not given no assumption on the possible value range should be made, although specific implementations will come with one. 

Without knowledge of specific implementation data modelers may assume that ever implementation can at least handle 64 bit [double precision floating point values](http://en.wikipedia.org/wiki/Double-precision_floating-point_format). 
Parameters min and xMin, max and xMax, precision and decimalDigits are pairwise exclusive.

##### min: Number
The smallest valid float value for a specific instance of the Float type. 

##### max: Number
The biggest valid float value for a specific instance of the Float type

##### xMin: Number
The smallest (exlusive) valid float value for a specific instance of the Float type. 

##### xMax: Number
The biggest (exclusive) valid float value for a specific instance of the Float type

##### precision: Integer[min:1]
The number of bits available for the [significand](http://en.wikipedia.org/wiki/Significand) of a floating point representation

##### decimalDigits: Integer[min:1]
The maximum number decimal places for a fixed point number

###String: Root
A character sequence

##### minLength: Integer[min:0] (default:0)
The minimal required length of a string type

##### maxLength: Integer[min:1]
The maximal allowed length of a string type. If not given no assumption about the maximal string length should get made. Without knowledge of specific implementation data modelers may assume that a string can hold at least 2^15 characters.

##### pattern: String
A regular expression that specifies a pattern all instances of that specific String type must match against

##### set: CharacterSet (default:unicode)

A set of characters a String Type is restricted to.

### Usage: Enum (usage:internal)

A RMDL internal type used to specify the intended usage of a given resource model type. Based on the intended usage, different compatibility rules for comparing different versions will get applied

#### in
A types's usage is restricted to incoming requests
#### out
A type's usage is restricted to outgoing responses
#### inOut
A type is used for both incoming request as well as outgoing responses.
#### internal
A type to be used only within RMDL and not allowed to be used within types elements of records that have another usage than internal. 

###CharacterSet: Enum (usage:internal)

A RMDL internal type used to specify character sets allowed within a String

#### unicode
#### ascii
#### iso\_8859\_1

###Collection: Root
A collection of items of a specific type.
##### type: Type (required)
The type of each item
##### minSize: Integer[min:0] (default:0)
The minimal amount of elements in the collection
##### maxSize: Integer[min:1]
The maximal amount of elements in the collection
##### ordered: Boolean (default:true)
Is the order of elements in the collection relevant
##### unique: Boolean (default:false)
Do the individual items have to be unique


###Dictionary: Root
A collection of key / value pairs
##### type: Type (required)
The type of each value item
##### keyType: Type[base:String] (default:String)
The type of each key item
##### minSize: Integer[min:0] (default:0)
The minimal amount of elements in the set
##### maxSize: Integer[min:1]
The maximal amount of elements in the set

###ScalarValue: Choice (usage:internal)
#### : Boolean
#### : Integer
#### : Number
#### : String

###DefaultValue: ScalarValue (usage:internal)
All types that are supported for default values
#### : Type


### Properties (usage:internal)

#### default: DefaultValue

Specifies for elements and type parameters the default value that is used in case the parameter or property is not explicitly set. 

#### required: Boolean (default:false)`

Specifies if an element is a required element

#### usage: Usage (default:out)`

Specifies the intended usage of a given type. Based on that property the corresponding compatibility for a given type get

#### readOnly: Boolean (default: false)`

Specifies for types with `usage:inOut` that a specific element definition is only valid for response representations. 

A given element can not contain have both properties readOnly and writeOnly set to true. But a type may contain two equally named element

#### writeOnly: Boolean (default: false)`

Specifies for types with `usage:inOut` that a specific element definition is only valid for request representations.

A given element can not contain have both properties readOnly and writeOnly set to true. But a type may contain two equally named element

#### final: Boolean (default:false)`

Specifies if subsequent versions of a given type definition will never add additional elements to the type

#### named: Boolean (default:false)`

Specifies if compatibility checks shall not only check if for structural compatibility, but also for the usage of the same type

#### version: Integer (default:0)`

Specifies the major version number for a resource model (used for both, package declaration and dependencies specification)
