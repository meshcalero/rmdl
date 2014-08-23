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
"true"					return 'TRUE'
"false"					return 'FALSE'
"("						return '('
")"						return ')'
"{"						return '{'
"}"						return '}'
"["						return '['
"]"						return ']'
","						return ','
":"						return ':'
"."						return "."
null					return 'NULL'
MODULE					return 'MODULE'
DEPENDENCY				return 'DEPENDENCY'
TYPE					return 'TYPE'
PARAM					return 'PARAM'
EXTENSION				return 'EXTENSION'
{char}{charDigit}*		return 'IDENTIFIER'

/lex

/* parser section */

%token					MODULE DEPENDENCY TYPE PARAM ELEMENT TRUE FALSE
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
	| EXTENSION ExtensionDecl				{ $$ = $ExtensionDecl; }
	| PARAM ParameterDecl					{ $$ = $ParameterDecl; }
	;

ModuleDecl 
	: IDENTIFIER 							{ $$ = new ast.TypedItemDecl( $1 ); }
	| IDENTIFIER ':' Reference 				{ $$ = new ast.TypedItemDecl( $1, $3 );  }
	| IDENTIFIER ':' Reference Properties 	{ $$ = new ast.TypedItemDecl( $1, $3, $4 ); }
	| IDENTIFIER Properties 				{ $$ = new ast.TypedItemDecl( $1, null, $2 ); }
	;

DependencyDecl
	: STRING								{ $$ = new ast.DependencyDecl( $1 ); }
	| STRING Properties						{ $$ = new ast.DependencyDecl( $1, $2 ); }
	;

TypeDecl
	: IDENTIFIER							{ $$ = new ast.TypedItemDecl( $1 ); }
	| IDENTIFIER ':' Reference				{ $$ = new ast.TypedItemDecl( $1, $3 ); }
	| IDENTIFIER ':' Reference Properties	{ $$ = new ast.TypedItemDecl( $1, $3, $4 ); }
	| IDENTIFIER Properties					{ $$ = new ast.TypedItemDecl( $1, null, $2 ); }
	;

ExtensionDecl
	: IDENTIFIER							{ $$ = new ast.TypedItemDecl( $1 ); }
	| IDENTIFIER ':' Reference				{ $$ = new ast.TypedItemDecl( $1, $3 ); }
	| IDENTIFIER ':' Reference Properties	{ $$ = new ast.TypedItemDecl( $1, $3, $4 ); }
	| ':' Reference							{ $$ = new ast.TypedItemDecl( null, $2 ); }
	;

ParameterDecl
	: IDENTIFIER ':' Reference				{ $$ = new ast.TypedItemDecl( $1, $3 ); }
	| IDENTIFIER ':' Reference Properties	{ $$ = new ast.TypedItemDecl( $1, $3, $4 ); }
	;

Reference
	: QualifiedIdentifier 						{ $$ = new ast.Reference( $1 ); }
	| QualifiedIdentifier '[' ']'				{ $$ = new ast.Reference( $1 ); }
	| QualifiedIdentifier '[' KeyValueList ']'	{ $$ = new ast.Reference( $1, $3 ); }
	;

Properties
	: '(' ')'								{ $$ = null; }
	| '(' KeyValueList ')'					{ $$ = new ast.Properties($2); }
	;

KeyValueList
	: KeyValue								{ $$ = [ $1 ] }
	| KeyValueList ',' KeyValue				{ $$ = $1.concat([$3]); } 
	;

KeyValue
	: Key									{ $$ = { itemType: 'reference', key: $1 }; }
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
	| Reference								{ $$ = { valueType: 'reference', value: $1 }; }
	;
	
Boolean
	: TRUE									{ $$ = true; }
	| FALSE									{ $$ = false; }
	;

QualifiedIdentifier
	: IDENTIFIER							{ $$ = $1;  }
	| QualifiedIdentifier '.' IDENTIFIER		{ $$ = $1 + '.' + $3; }
	;

%%