import { Lexer, createToken } from 'chevrotain';

export const Comma = createToken({ name: 'Comma', pattern: ',' });
export const Semicolon = createToken({ name: 'Semicolon', pattern: ';' });
export const Colon = createToken({ name: 'Colon', pattern: ':' });
export const Equals = createToken({ name: 'Equals', pattern: '=' });
export const WhiteSpace = createToken({ name: 'WhiteSpace', pattern: /\s+/ });
export const Integer = createToken({ name: 'Integer', pattern: /0|[1-9]\d*/ });

export const LeftSquareBrace = createToken({ name: 'LeftSquareBrace', pattern: '[' });
export const RightSquareBrace = createToken({ name: 'RightSquareBrace', pattern: ']' });

export const EnumKeyword = createToken({ name: 'EnumKeyword', pattern: 'enum' });
export const LeftCurlyBrace = createToken({ name: 'LeftCurlyBrace', pattern: '{' });
export const RightCurlyBrace = createToken({ name: 'RightCurlyBrace', pattern: '}' });

export const Identifier = createToken({ name: 'Identifier', pattern: /\w+/ });

export const TypeNameBoolean = createToken({ name: 'TypeNameBoolean', pattern: 'bool' });
export const TypeNameChar = createToken({ name: 'TypeNameChar', pattern: 'char' });
export const TypeNameInt8 = createToken({ name: 'TypeNameInt8', pattern: 'int8' });
export const TypeNameInt16 = createToken({ name: 'TypeNameInt16', pattern: 'int16' });
export const TypeNameInt32 = createToken({ name: 'TypeNameInt32', pattern: 'int32' });
export const TypeNameInt64 = createToken({ name: 'TypeNameInt64', pattern: 'int64' });
export const TypeNameUint8 = createToken({ name: 'TypeNameUint8', pattern: 'uint8' });
export const TypeNameUint16 = createToken({ name: 'TypeNameUint16', pattern: 'uint16' });
export const TypeNameUint32 = createToken({ name: 'TypeNameUint32', pattern: 'uint32' });
export const TypeNameUint64 = createToken({ name: 'TypeNameUint64', pattern: 'uint64' });
export const TypeNameFloat32 = createToken({ name: 'TypeNameFloat32', pattern: /float32|float/ });
export const TypeNameFloat64 = createToken({ name: 'TypeNameFloat64', pattern: /float64|double/ });

export const allTokens = [
	WhiteSpace,
	Semicolon,
	Colon,
	Integer,

	LeftSquareBrace,
	RightSquareBrace,

	EnumKeyword,
	LeftCurlyBrace,
	RightCurlyBrace,

	TypeNameBoolean,
	TypeNameChar,
	TypeNameInt8,
	TypeNameInt16,
	TypeNameInt32,
	TypeNameInt64,
	TypeNameUint8,
	TypeNameUint16,
	TypeNameUint32,
	TypeNameUint64,
	TypeNameFloat32,
	TypeNameFloat64,

	Identifier,
];

export const lexer = new Lexer(allTokens);
