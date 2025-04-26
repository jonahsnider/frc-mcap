import { lexer } from './lexer';
import { parser } from './parser';
import type { StructSpecification } from './types';
import { StandardDeclarationVisitor } from './visitors/standard-declaration-visitor';

const standardDeclarationVisitor = new StandardDeclarationVisitor();

export function parseStructSpecification(declaration: string): StructSpecification {
	const lexingResult = lexer.tokenize(declaration);

	if (lexingResult.errors.length > 0) {
		throw new AggregateError(lexingResult.errors, 'Failed to parse struct specification');
	}

	console.log(lexingResult.tokens.map((token) => [token.tokenType.name, token.image]));

	parser.input = lexingResult.tokens;

	const cstNode = parser.structSpecification();

	if (parser.errors.length > 0) {
		for (const error of parser.errors) {
			console.error(error);
		}

		throw new AggregateError(parser.errors, 'Failed to parse struct specification');
	}

	// TODO: Finish implementing
	return [standardDeclarationVisitor.visit(cstNode)];
}
