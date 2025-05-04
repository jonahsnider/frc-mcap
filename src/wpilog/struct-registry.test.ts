import { describe, expect, test } from 'bun:test';
import { StructDecodeQueue } from './struct-decode-queue';
import { StructRegistry } from './struct-registry';
import type { StructPayload, StructPayloadValue } from './types';

describe('calculate byte size', () => {
	test('bool value', () => {
		const registry = new StructRegistry(new StructDecodeQueue(() => {}));
		registry.register('MyStruct', 'bool value');

		// biome-ignore lint/complexity/useLiteralKeys: This is to access a private field
		expect(registry['getByteLength']('MyStruct')).toBe(1);
	});

	test('double arr[4]', () => {
		const registry = new StructRegistry(new StructDecodeQueue(() => {}));

		registry.register('MyStruct', 'double arr[4]');

		// biome-ignore lint/complexity/useLiteralKeys: This is to access a private field
		expect(registry['getByteLength']('MyStruct')).toBe(4 * 8);
	});

	test('enum {a=1, b=2} int8 val', () => {
		const registry = new StructRegistry(new StructDecodeQueue(() => {}));

		registry.register('MyStruct', 'enum {a=1, b=2} int8 val');

		// biome-ignore lint/complexity/useLiteralKeys: This is to access a private field
		expect(registry['getByteLength']('MyStruct')).toBe(1);
	});

	test('nested structs', () => {
		const registry = new StructRegistry(new StructDecodeQueue(() => {}));

		registry.register('Inner', 'int16 i;int8 x');
		registry.register('Outer', 'char c; Inner s; bool b');

		// biome-ignore lint/complexity/useLiteralKeys: This is to access a private field
		expect(registry['getByteLength']('Inner')).toBe(3);
		// biome-ignore lint/complexity/useLiteralKeys: This is to access a private field
		expect(registry['getByteLength']('Outer')).toBe(1 + 3 + 1);
	});
});

describe('decode structs', () => {
	test('char array (string)', () => {
		const registry = new StructRegistry(new StructDecodeQueue(() => {}));

		registry.register('MyStruct', 'char string[4]');

		const buffer = new Uint8Array([0b01100001, 0b01100010, 0b01100011, 0b01100100]);

		expect(registry.decode('MyStruct', buffer)).toStrictEqual(new Map([['string', 'abcd']]));
	});

	test('nested structs', () => {
		const registry = new StructRegistry(new StructDecodeQueue(() => {}));

		registry.register(
			'Inner',
			`int16 i;
int8 x;`,
		);
		registry.register(
			'Outer',
			`char c;
Inner s;
bool b;`,
		);

		const buffer = new Uint8Array(5);

		const inner: StructPayload = new Map([
			['i', 581],
			['x', 0x1],
		]);

		const outer: StructPayload = new Map<string, StructPayloadValue>([
			['c', 'a'],
			['s', inner],
			['b', true],
		]);

		const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

		view.setUint8(0, 'a'.charCodeAt(0));

		// Inner
		view.setInt16(1, 581, true);
		view.setUint8(3, 1);

		view.setUint8(4, 2);

		expect(registry.decode('Outer', buffer)).toStrictEqual(outer);
	});

	test.todo('nested structs with bit-fields', () => {
		const registry = new StructRegistry(new StructDecodeQueue(() => {}));

		registry.register('Inner', 'int8 a:1;');
		registry.register(
			'Outer',
			`int8 b:1;
Outer s;
int8 c:1;`,
		);
	});
});
