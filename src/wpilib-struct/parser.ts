import { CstParser } from 'chevrotain';
import * as Tokens from './lexer';

export class StructParser extends CstParser {
	public readonly structSpecification = this.RULE('structSpecification', () => {
		this.MANY_SEP({ SEP: Tokens.Semicolon, DEF: () => this.SUBRULE(this.declaration) });
	});

	private readonly declaration = this.RULE('declaration', () => {
		this.OPTION({ DEF: () => this.SUBRULE(this.enumSpecification) });

		this.SUBRULE(this.optionalWhitespace);

		this.SUBRULE1(this.typeName);

		this.OPTION1({
			DEF: () =>
				this.OR({
					DEF: [
						{ ALT: () => this.SUBRULE(this.bitFieldDeclaration) },
						{ ALT: () => this.SUBRULE(this.standardDeclarationArray) },
					],
				}),
		});
	});

	private readonly standardDeclarationArray = this.RULE('standardDeclarationArray', () => {
		this.SUBRULE(this.optionalWhitespace);

		this.SUBRULE(this.arraySize);
	});

	private readonly bitFieldDeclaration = this.RULE('bitFieldDeclaration', () => {
		this.CONSUME(Tokens.WhiteSpace);
		this.CONSUME1(Tokens.Identifier);
		this.CONSUME2(Tokens.Colon);
		this.SUBRULE(this.optionalWhitespace);
		this.CONSUME3(Tokens.Integer);
	});

	private readonly arraySize = this.RULE('arraySize', () => {
		this.CONSUME(Tokens.LeftSquareBrace);
		this.SUBRULE(this.optionalWhitespace);
		this.CONSUME1(Tokens.Integer);
		this.SUBRULE1(this.optionalWhitespace);
		this.CONSUME2(Tokens.RightSquareBrace);
	});

	private readonly enumSpecification = this.RULE('enumSpecification', () => {
		this.OPTION({ DEF: () => this.CONSUME(Tokens.EnumKeyword) });
		this.SUBRULE(this.optionalWhitespace);
		this.CONSUME(Tokens.LeftCurlyBrace);
		this.MANY_SEP({ SEP: Tokens.Comma, DEF: () => this.SUBRULE(this.enumMember) });
		this.SUBRULE1(this.optionalWhitespace);
		this.CONSUME(Tokens.RightCurlyBrace);
	});

	private readonly enumMember = this.RULE('enumMember', () => {
		this.SUBRULE(this.optionalWhitespace);
		this.CONSUME(Tokens.Identifier);
		this.SUBRULE1(this.optionalWhitespace);
		this.CONSUME(Tokens.Equals);
		this.SUBRULE2(this.optionalWhitespace);
		this.CONSUME(Tokens.Integer);
		this.SUBRULE3(this.optionalWhitespace);
	});

	private readonly optionalWhitespace = this.RULE('optionalWhitespace', () => {
		this.OPTION({ DEF: () => this.CONSUME(Tokens.WhiteSpace) });
	});

	private readonly typeName = this.RULE('typeName', () => {
		this.OR([
			{ ALT: () => this.CONSUME(Tokens.TypeNameBoolean) },
			{ ALT: () => this.CONSUME(Tokens.TypeNameChar) },
			{ ALT: () => this.CONSUME(Tokens.TypeNameInt8) },
			{ ALT: () => this.CONSUME(Tokens.TypeNameInt16) },
			{ ALT: () => this.CONSUME(Tokens.TypeNameInt32) },
			{ ALT: () => this.CONSUME(Tokens.TypeNameInt64) },
			{ ALT: () => this.CONSUME(Tokens.TypeNameUint8) },
			{ ALT: () => this.CONSUME(Tokens.TypeNameUint16) },
			{ ALT: () => this.CONSUME(Tokens.TypeNameUint32) },
			{ ALT: () => this.CONSUME(Tokens.TypeNameUint64) },
			{ ALT: () => this.CONSUME(Tokens.TypeNameFloat32) },
			{ ALT: () => this.CONSUME(Tokens.TypeNameFloat64) },
			{ ALT: () => this.CONSUME(Tokens.Identifier) },
		]);
	});

	constructor() {
		super(Tokens.allTokens);

		this.performSelfAnalysis();
	}
}

export const parser = new StructParser();
