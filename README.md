rmdl
====

An attempt to develop a compiler for a [Resource Model Definition Language](doc/resource-model-definition.md) for web service API.

**This project is in very early state**. It does not yet provide any useful functionality.

Prerequisite
------
* `node`
* `grunt`

Getting started
-----

Clone the rmdl project on your machine and build whatever may be available

	git clone https://github.com/meshcalero/rmdl.git
	cd rmdl
	npm install
	grunt

Once things (hopefully) got built, you can process RMDL files and see the derived resource model specification (as described in [RMDL Toolchain](doc/rmdl-toolschain.md).

E.g. when you want to see the representation for RMDL's core types, you can call:

	node lib/rmdc.js models/core.rmd.md

If you want to play with your own spec, just add your model file as additional parameter to the compiler call:

	node lib/rmdc.js models/core.rmd.md models/mytestmodel.rmd.md

Future version will "implicitly" load RMDL's predefined models, but for now, you have to live with that inconvenience.
