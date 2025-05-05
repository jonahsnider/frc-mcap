import { lexer } from './lexer.js';
import { StructParser } from './parser.js';

// @ts-expect-error This is used in a separate build script
return {
	lexer: lexer,
	parser: StructParser,
	defaultRule: 'structSpecification',
};
