import { lexer } from './lexer';
import { StructParser } from './parser';

return {
	lexer: lexer,
	parser: StructParser,
	defaultRule: 'structSpecification',
};
