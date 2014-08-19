/* A jison grammar spec for the RMDL constructs */

/* lexer section */
%options flex

%lex
digit					[0-9]
int						\-?(?:[0-9]|[1-9][0-9]+)
exp						(?:[eE][-+]?[0-9]+)
frac					(?:\.[0-9]+)
char					[A-Za-z_]
charDigit				[0-9A-Za-z_]
unicode					\\u[a-fA-F0-9]{4}
escChar					\\["bfnrt/\\]
strChar					[^"\\]
/*
uri						\((([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?\)
*/

%%


\s+						/* skip whitespace */
{int}{frac}?{exp}?\b	return 'NUMBER';
\"(?:{escChar}|{unicode}|{strChar})*\"		yytext = yytext.substr(1,yyleng-2); return 'STRING';
"("						return '('
")"						return ')'
"{"						return '{'
"}"						return '}'
"["						return '['
"]"						return ']'
","						return ','
":"						return ':'
null					return 'NULL'
MODULE					return 'MODULE'
DEPENDENCY				return 'DEPENDENCY'
TYPE					return 'TYPE'
PARAM					return 'PARAM'
ELEMENT					return 'ELEMENT'
{char}{charDigit}*		return 'IDENTIFIER'

/lex

/* parser section */

%token					MODULE DEPENDENCY TYPE PARAM ELEMENT 
%token					IDENTIFIER STRING NUMBER ( ) { } [ ] , : NULL

%start					RmdlLine

%ebnf			

%{
var assert = require('assert');
var ast = require('../src/rmdl_ast.js');
%}


%%	

RmdlLine
	: LineOptions							{ return $$ = $LineOptions; }
	;

LineOptions
	: MODULE ModuleDecl 					{ $$ = $ModuleDecl; }
	| DEPENDENCY DependencyDecl				{ $$ = $DependencyDecl; }
	| TYPE TypeDecl							{ $$ = $TypeDecl; }
	| ELEMENT ElementDecl					{ $$ = $ElementDecl; }
	| PARAM ParameterDecl					{ $$ = $ParameterDecl; }
	;

ModuleDecl 
	: IDENTIFIER 							{ $$ = new ast.ModuleDecl( $1 ); }
	| IDENTIFIER ':' TypeReference 			{ $$ = new ast.ModuleDecl( $1, $3 );  }
	| IDENTIFIER ':' TypeReference Properties 	{ $$ = new ast.ModuleDecl( $1, $3, $4 ); }
	| IDENTIFIER Properties 					{ $$ = new ast.ModuleDecl( $1, null, $4 ); }
	;

DependencyDecl
	: STRING								{ $$ = { uri : $1, properties: {} }; }
	| STRING Properties						{ $$ = { uri : $1, properties: $2 }; }
	;

TypeDecl
	: IDENTIFIER							{ $$ = new ast.TypeDecl( $1 ); }
	| IDENTIFIER ':' TypeReference			{ $$ = new ast.TypeDecl( $1, $3 ); }
	| IDENTIFIER ':' TypeReference Properties	{ $$ = new ast.TypeDecl( $1, $3, $4 ); }
	| IDENTIFIER Properties					{ $$ = new ast.TypeDecl( $1, null, $2 ); }
	;

ElementDecl
	: IDENTIFIER							{ $$ = new ast.ElementDecl( $1 ); }
	| IDENTIFIER ':' TypeReference			{ $$ = new ast.ElementDecl( $1, $3 ); }
	| IDENTIFIER ':' TypeReference Properties	{ $$ = new ast.ElementDecl( $1, $3, $4 ); }
	| ':' TypeReference						{ $$ = new ast.ElementDecl( null, $2 ); }
	;

ParameterDecl
	: IDENTIFIER ':' TypeReference			{ $$ = { name : $1, type: $3 }; }
	| IDENTIFIER ':' TypeReference Properties	{ $$ = { name : $1, type: $3, properties: $4 }; }
	;

TypeReference
	: IDENTIFIER 							{ $$= { refType: 'type', name: $1, params: [] }; }
	| IDENTIFIER '[' ']'					{ $$= { refType: 'type', name: $1, params: [] }; }
	| IDENTIFIER '[' KeyValueList ']'		{ $$= { refType: 'type', name: $1, params: $3 }; }
	;

Properties
	: '(' ')'								{ $$ = null; }
	| '(' KeyValueList ')'					{ $$ = $2; }
	;

KeyValueList
	: KeyValue								{ $$ = [ $1 ] }
	| KeyValueList ',' KeyValue				{ $$ = $1.concat([$3]); } 
	;

KeyValue
	: Key									{ $$ = { itemType: 'keyValue', key: $1, value: { valueType: 'boolean', value: true } }; }
	| Key ':' Value							{ $$ = { itemType: 'keyValue', key: $1, value: $3 }; }
	;

Key
	: QualifiedIdentifier					{ $$ = $1; }
	;

KeyOrValue
	: Value									{ $$ = { itemType: ($1.valueType=='identifier'?'keyOrValue':'value'), value : $1.value }; }
	;

Value
	: NUMBER								{ $$ = { valueType: 'number', value: Number(yytext)}; }
	| STRING								{ $$ = { valueType: 'string', value: yytext }; }
	| Boolean								{ $$ = { valueType: 'boolean', value: $1 }; }
	| NULL									{ $$ = { valueType: 'null', value: null }; }
	| QualifiedIdentifier					{ $$ = { valueType: 'identifier', value: $1 }; }
	| IDENTIFIER '[' ']'					{ $$ = { valueType: 'reference', value: { refType: 'type', name: $1 } }; }
	| IDENTIFIER '[' KeyValueList ']'		{ $$ = { valueType: 'reference', value: { refType: 'type', name: $1, params: $3 } }; }
	;

Boolean
	: TRUE									{ $$ = true; }
	| FALSE									{ $$ = false; }
	;

QualifiedIdentifier
	: IDENTIFIER							{ $$ = $1;  }
	| QualifiedIdentifier '.' IDENTIFIER		{ $$ = $1 + '.' + $2; }
	;

%%