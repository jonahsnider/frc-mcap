import { lexer } from './lexer';
import { parser } from './parser';
import type { StructSpecification } from './types';
import { StructAstVisitor } from './visitors/struct-ast-visitor';

const structAstVisitor = new StructAstVisitor();

export function parseStructSpecification(declaration: string): StructSpecification {
	const lexingResult = lexer.tokenize(declaration);

	if (lexingResult.errors.length > 0) {
		throw new AggregateError(lexingResult.errors, 'Failed to lex struct specification');
	}

	parser.input = lexingResult.tokens;

	const cstNode = parser.structSpecification();

	if (parser.errors.length > 0) {
		throw new AggregateError(parser.errors, 'Failed to parse struct specification');
	}

	return structAstVisitor.structSpecification(cstNode.children);
}
