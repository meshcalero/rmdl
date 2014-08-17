Core (version:0)
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

* `Usage`: Specifies restriction on the allowed usage of a type
* `CharacterSet`: Specifies restrictions for the characters in a String
* `DefaultValue`: Used for the specification of default values

### Type

The internal type `Type` is the root type of all RMDL types. The type is primary needed as type identifier for type parameters that hold types.
 

### Record: Type

A `Record` type allows the composition of various named elements in a new data type. This type is the default parent type of new created types. Each element is specified in an element section of the new type. 

### Enum: Type 

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

### Choice: Type

A Choice type that can hold **one of** multiple alternative types. The individual alternatives are specified as elements of the Choice. 

##### named: Boolean (default:false)
Indicates if the model contains the name of the element that is actually contained in an instance of the type

### Boolean: Enum (final:true)
A boolean value
#### true
#### false

### Integer: Type
Any number that doesn't require a fractional component. Two parameters allow to restrict the value range of a specific Integer type instance. If not given no assumption on the possible value range should be made, although specific implementations will come with one. Without knowledge of specific implementation data modelers may assume that ever implementation can at least handle 32 bit integer values. 

##### min: Integer
The smallest valid integer value for a specific instance of the Integer type. 

##### max: Integer
The biggest valid integer value for a specific instance of the Integer type

### Number: Type
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

###String: Type
A character sequence

##### minLength: Integer[min:0] (default:0)
The minimal required length of a string type

##### maxLength: Integer[min:1]
The maximal allowed length of a string type. If not given no assumption about the maximal string length should get made. Without knowledge of specific implementation data modelers may assume that a string can hold at least 2^15 characters.

##### pattern: String
A regular expression that specifies a pattern all instances of that specific String type must match against

##### set: CharacterSet (default:Unicode)

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

###Collection: Type
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


###Dictionary: Type
A collection of key / value pairs
##### keyType: Type (required)
The type of each key item
##### valueType: Type
The type of each value item
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
