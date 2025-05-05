import assert from 'node:assert/strict';
import type {
	ArraySizeCstChildren,
	BitFieldDeclarationCstChildren,
	DeclarationCstChildren,
	EnumMemberCstChildren,
	EnumSpecificationCstChildren,
	StandardDeclarationArrayCstChildren,
	StructSpecificationCstChildren,
} from '../generated';
import { type EnumSpecification, KnownStructTypeName, type StructDeclaration, type StructTypeName } from '../types';
import { BaseStructVisitorWithDefaults } from './visitors';

export class StructAstVisitor extends BaseStructVisitorWithDefaults {
	constructor() {
		super();

		this.validateVisitor();
	}

	structSpecification(children: StructSpecificationCstChildren): StructDeclaration[] {
		return children.declaration?.map((declaration) => this.declaration(declaration.children)) ?? [];
	}

	declaration(children: DeclarationCstChildren): StructDeclaration {
		const [typeName, name] = children.Identifier;
		assert(typeName);
		assert(name);

		const enumSpecification = children.enumSpecification
			? // biome-ignore lint/style/noNonNullAssertion: This is safe because Chevrotain will never return an empty array
				this.enumSpecification(children.enumSpecification[0]!.children, typeName.image)
			: undefined;

		const arraySize = children.standardDeclarationArray
			? // biome-ignore lint/style/noNonNullAssertion: This is safe because Chevrotain will never return an empty array
				this.standardDeclarationArray(children.standardDeclarationArray[0]!.children)
			: undefined;

		const bitWidth = children.bitFieldDeclaration
			? // biome-ignore lint/style/noNonNullAssertion: This is safe because Chevrotain will never return an empty array
				this.bitFieldDeclaration(children.bitFieldDeclaration[0]!.children, typeName.image)
			: undefined;

		return {
			name: name.image,
			value: typeName.image,
			enumSpecification,
			arraySize,
			bitWidth,
		};
	}

	enumSpecification(children: EnumSpecificationCstChildren, dataType: StructTypeName): EnumSpecification {
		switch (dataType) {
			case KnownStructTypeName.Int8:
			case KnownStructTypeName.Uint8:
			case KnownStructTypeName.Int16:
			case KnownStructTypeName.Uint16:
			case KnownStructTypeName.Int32:
			case KnownStructTypeName.Uint32:
			case KnownStructTypeName.Int64:
			case KnownStructTypeName.Uint64:
				break;
			default:
				throw new RangeError('Enums must be integers');
		}

		const entries = children.enumMember?.map((member) => this.enumMember(member.children));

		return new Map(entries);
	}

	enumMember(children: EnumMemberCstChildren): [name: string, value: bigint] {
		const [name] = children.Identifier;
		const [value] = children.Integer;

		// biome-ignore lint/style/noNonNullAssertion: This is safe because Chevrotain will never return an empty array
		return [name!.image, BigInt(value!.image)];
	}

	bitFieldDeclaration(children: BitFieldDeclarationCstChildren, dataType: StructTypeName): number {
		const [value] = children.Integer;
		// biome-ignore lint/style/noNonNullAssertion: This is safe because Chevrotain will never return an empty array
		const parsed = Number(value!.image);

		switch (dataType) {
			case KnownStructTypeName.Boolean:
				assert(parsed === 1, new RangeError('Boolean bit-field members must be 1 bit'));
				break;
			case KnownStructTypeName.Int8:
			case KnownStructTypeName.Uint8:
				assert(parsed <= 8, new RangeError('8-bit bit-field members must be less than 8 bits'));
				break;
			case KnownStructTypeName.Int16:
			case KnownStructTypeName.Uint16:
				assert(parsed <= 16, new RangeError('16-bit bit-field members must be less than 16 bits'));
				break;
			case KnownStructTypeName.Int32:
			case KnownStructTypeName.Uint32:
				assert(parsed <= 32, new RangeError('32-bit bit-field members must be less than 32 bits'));
				break;
			case KnownStructTypeName.Int64:
			case KnownStructTypeName.Uint64:
				assert(parsed <= 64, new RangeError('64-bit bit-field members must be less than 64 bits'));
				break;
			default:
				throw new RangeError('Bit-field members must be integers or booleans');
		}

		return parsed;
	}

	standardDeclarationArray(children: StandardDeclarationArrayCstChildren): number {
		// biome-ignore lint/style/noNonNullAssertion: This is safe because Chevrotain will never return an empty array
		return this.arraySize(children.arraySize[0]!.children);
	}

	arraySize(children: ArraySizeCstChildren): number {
		const [value] = children.Integer;

		// biome-ignore lint/style/noNonNullAssertion: This is safe because Chevrotain will never return an empty array
		return Number(value!.image);
	}
}
