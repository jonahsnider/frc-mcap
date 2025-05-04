import { lexer } from './lexer';
import { parser } from './parser';
import type { StructDeclaration } from './types';
import { StructAstVisitor } from './visitors/struct-ast-visitor';

const structAstVisitor = new StructAstVisitor();

const cache = new Map<string, StructDeclaration[]>();

export function parseStructSpecification(declaration: string): StructDeclaration[] {
	const existing = cache.get(declaration);

	if (existing) {
		return existing;
	}

	const lexingResult = lexer.tokenize(declaration);

	if (lexingResult.errors.length > 0) {
		throw new AggregateError(lexingResult.errors, 'Failed to lex struct specification');
	}

	parser.input = lexingResult.tokens;

	const cstNode = parser.structSpecification();

	if (parser.errors.length > 0) {
		throw new AggregateError(parser.errors, 'Failed to parse struct specification');
	}

	const created = structAstVisitor.structSpecification(cstNode.children);
	cache.set(declaration, created);
	return created;
}
