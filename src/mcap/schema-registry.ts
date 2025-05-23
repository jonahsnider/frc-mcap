import assert from 'node:assert/strict';
import { type TAnySchema, type TArray, type TObject, Type } from '@sinclair/typebox';
import { Ajv } from 'ajv';
import type { ValidateFunction } from 'ajv/dist/core.js';
import betterAjvErrors from 'better-ajv-errors';
import { KnownStructTypeName } from '../wpilib-struct/types.js';
import { PayloadParser } from '../wpilog/payload-parser.js';
import type { StructRegistry } from '../wpilog/struct-registry.js';
import { WpilogRecordType } from '../wpilog/types.js';

type SchemaEntry = {
	schema: TAnySchema;
	validateFunction: ValidateFunction<unknown>;
};

export class SchemaRegistry {
	private readonly schemas = new Map<WpilogRecordType | string, SchemaEntry>();
	private readonly nestedSchemas = new Map<KnownStructTypeName | string, SchemaEntry>();
	private readonly ajv = new Ajv({});

	constructor(private readonly structRegistry: StructRegistry) {
		this.registerSchema(WpilogRecordType.Boolean, Type.Object({ value: Type.Boolean() }, { title: 'boolean' }), false);
		this.registerSchema(WpilogRecordType.Int64, Type.Object({ value: Type.Integer() }, { title: 'int64' }), false);
		this.registerSchema(WpilogRecordType.Float, Type.Object({ value: Type.Number() }, { title: 'float' }), false);
		this.registerSchema(WpilogRecordType.Double, Type.Object({ value: Type.Number() }, { title: 'double' }), false);
		this.registerSchema(WpilogRecordType.String, Type.Object({ value: Type.String() }, { title: 'string' }), false);

		this.registerSchema(
			WpilogRecordType.BooleanArray,
			Type.Object({ value: Type.Array(Type.Boolean({ title: 'boolean' })) }, { title: 'boolean[]' }),
			false,
		);
		this.registerSchema(
			WpilogRecordType.Int64Array,
			Type.Object({ value: Type.Array(Type.Integer({ title: 'integer' })) }, { title: 'int64[]' }),
			false,
		);
		this.registerSchema(
			WpilogRecordType.FloatArray,
			Type.Object({ value: Type.Array(Type.Number({ title: 'number' })) }, { title: 'float[]' }),
			false,
		);
		this.registerSchema(
			WpilogRecordType.DoubleArray,
			Type.Object({ value: Type.Array(Type.Number({ title: 'number' })) }, { title: 'double[]' }),
			false,
		);
		this.registerSchema(
			'string[]',
			Type.Object({ value: Type.Array(Type.String({ title: 'string' })) }, { title: 'string[]' }),
			false,
		);

		// Nested schemas, referenced in structs
		this.registerSchema(KnownStructTypeName.Boolean, Type.Boolean({ title: 'boolean' }), true);
		this.registerSchema(KnownStructTypeName.Character, Type.String({ title: 'char' }), true);
		this.registerSchema(KnownStructTypeName.Int8, Type.Integer({ title: 'int8' }), true);
		this.registerSchema(KnownStructTypeName.Int16, Type.Integer({ title: 'int16' }), true);
		this.registerSchema(KnownStructTypeName.Int32, Type.Integer({ title: 'int32' }), true);
		this.registerSchema(KnownStructTypeName.Int64, Type.Integer({ title: 'int64' }), true);
		this.registerSchema(KnownStructTypeName.Uint8, Type.Integer({ title: 'uint8' }), true);
		this.registerSchema(KnownStructTypeName.Uint16, Type.Integer({ title: 'uint16' }), true);
		this.registerSchema(KnownStructTypeName.Uint32, Type.Integer({ title: 'uint32' }), true);
		this.registerSchema(KnownStructTypeName.Uint64, Type.Integer({ title: 'uint64' }), true);
		this.registerSchema(KnownStructTypeName.Float32, Type.Number({ title: 'float' }), true);
		this.registerSchema(KnownStructTypeName.Float, Type.Number({ title: 'float' }), true);
		this.registerSchema(KnownStructTypeName.Float64, Type.Number({ title: 'double' }), true);
		this.registerSchema(KnownStructTypeName.Double, Type.Number({ title: 'double' }), true);
	}

	getSchema(type: string): TAnySchema {
		return this.getEntry(type, false).schema;
	}

	validateMessage(type: string, value: unknown): void {
		const { schema, validateFunction } = this.getEntry(type, false);
		const valid = validateFunction(value);

		if (!valid) {
			assert(validateFunction.errors);

			console.error(betterAjvErrors.default(schema, value, validateFunction.errors));

			throw new RangeError('Invalid struct data provided');
		}
	}

	private getEntry(type: string, nested: boolean): SchemaEntry {
		const existing = nested ? this.nestedSchemas.get(type) : this.schemas.get(type);

		if (existing) {
			return existing;
		}

		const wasArrayType = type.endsWith(PayloadParser.STRUCT_ARRAY_SUFFIX);
		const normalizedTypeName = wasArrayType ? type.slice(0, -PayloadParser.STRUCT_ARRAY_SUFFIX.length) : type;

		const schemas = this.structToSchema(normalizedTypeName);

		const topLevelSingleEntry = this.registerSchema(normalizedTypeName, schemas.single, false);
		const nestedSingleEntry = this.registerSchema(normalizedTypeName, schemas.single, true);
		const topLevelArrayEntry = this.registerSchema(
			normalizedTypeName + PayloadParser.STRUCT_ARRAY_SUFFIX,
			schemas.topLevelArray,
			false,
		);
		const nestedArrayEntry = this.registerSchema(
			normalizedTypeName + PayloadParser.STRUCT_ARRAY_SUFFIX,
			schemas.nestedArray,
			true,
		);

		if (nested) {
			return wasArrayType ? nestedArrayEntry : nestedSingleEntry;
		}

		return wasArrayType ? topLevelArrayEntry : topLevelSingleEntry;
	}

	private structToSchema(structName: string): { single: TObject; topLevelArray: TObject; nestedArray: TArray } {
		const structSpecification = this.structRegistry.getDefinition(structName);

		const baseSchema = Type.Object(
			Object.fromEntries(
				structSpecification.map((member) => {
					return [member.name, this.structMemberValueToSchema(member.value, member.arraySize !== undefined)];
				}),
			),
			{
				title: structName,
			},
		);

		const nestedArray = Type.Array(baseSchema, { title: baseSchema.title + PayloadParser.STRUCT_ARRAY_SUFFIX });
		const topLevelArray = Type.Object(
			{ value: nestedArray },
			{ title: baseSchema.title + PayloadParser.STRUCT_ARRAY_SUFFIX },
		);

		return {
			single: baseSchema,
			topLevelArray: topLevelArray,
			nestedArray,
		};
	}

	private structMemberValueToSchema(valueTypeName: string, array: boolean): TAnySchema {
		if (valueTypeName === KnownStructTypeName.Character && array) {
			return Type.String({ title: 'string' });
		}

		if (array) {
			return this.getEntry(valueTypeName + PayloadParser.STRUCT_ARRAY_SUFFIX, true).schema;
		}

		return this.getEntry(valueTypeName, true).schema;
	}

	private registerSchema(typeName: string, schema: TAnySchema, nested: boolean): SchemaEntry {
		const entry: SchemaEntry = { schema, validateFunction: this.ajv.compile(schema) };
		if (nested) {
			this.nestedSchemas.set(typeName, entry);
		} else {
			this.schemas.set(typeName, entry);
		}

		return entry;
	}
}
