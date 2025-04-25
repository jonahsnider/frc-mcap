import assert from 'node:assert/strict';
import { type TAnySchema, type TObject, Type } from '@sinclair/typebox';
import Ajv from 'ajv';

export class SchemaRegistry {
	private readonly schemas = new Map<string, TObject>();
	private readonly ajv = new Ajv({});

	constructor() {
		// Add default types
		this.schemas.set('boolean', Type.Object({ value: Type.Boolean() }, { title: 'boolean' }));
		this.schemas.set('int64', Type.Object({ value: Type.Integer() }, { title: 'int64' }));
		this.schemas.set('float', Type.Object({ value: Type.Number() }, { title: 'float' }));
		this.schemas.set('double', Type.Object({ value: Type.Number() }, { title: 'double' }));
		this.schemas.set('string', Type.Object({ value: Type.String() }, { title: 'string' }));

		this.schemas.set('boolean[]', Type.Object({ value: Type.Array(Type.Boolean()) }, { title: 'boolean[]' }));
		this.schemas.set('int64[]', Type.Object({ value: Type.Array(Type.Integer()) }, { title: 'int64[]' }));
		this.schemas.set('float[]', Type.Object({ value: Type.Array(Type.Number()) }, { title: 'float[]' }));
		this.schemas.set('double[]', Type.Object({ value: Type.Array(Type.Number()) }, { title: 'double[]' }));
		this.schemas.set('string[]', Type.Object({ value: Type.Array(Type.String()) }, { title: 'string[]' }));
	}

	getSchema(type: string): TAnySchema {
		const schema = this.schemas.get(type) ?? Type.Any({ title: type, description: `Unknown type: ${type}` });

		const valid = this.ajv.validateSchema(schema, true);

		assert.strictEqual(valid, true);

		return schema;
	}

	validateMessage(type: string, value: unknown): void {
		const valid = this.ajv.validate(this.getSchema(type), value);

		if (!valid) {
			assert(this.ajv.errors);

			console.log({ type, value });

			throw new RangeError(`Failed validation for type ${type}: ${this.ajv.errorsText(this.ajv.errors)}`);
		}
	}
}
