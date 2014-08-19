EmptyModule
----

SimpleModule
----
###EmptyType
###SimpleRecord
####integer : Integer
####string : String
####number : Number
####boolean : Boolean

SimpleResource : ResourceType
----
###ResourceType
####element : Integer

CollectionResource : Collection[type:ResourceType]
---
###ResourceType
####element : Integer

DependentModule
---
##### "#SimpleModule"
