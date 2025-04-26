import { describe, expect, test } from 'bun:test';
import { parseStructSpecification } from '.';
import { KnownStructTypeName } from './types';

describe('parse struct specification', () => {
	test('bool value', () => {
		expect(parseStructSpecification('bool value')).toStrictEqual([
			{
				name: 'value',
				value: KnownStructTypeName.Boolean,
				enumSpecification: undefined,
				arraySize: undefined,
				bitWidth: undefined,
			},
		]);
	});
	test('double arr[4]', () => {
		expect(parseStructSpecification('double arr[4]')).toStrictEqual([
			{
				name: 'arr',
				value: KnownStructTypeName.Double,
				enumSpecification: undefined,
				arraySize: 4,
				bitWidth: undefined,
			},
		]);
	});

	test('enum {a=1, b=2} int8 val', () => {
		expect(parseStructSpecification('enum {a=1, b=2} int8 val')).toStrictEqual([
			{
				name: 'val',
				value: KnownStructTypeName.Int8,
				enumSpecification: new Map([
					['a', 1n],
					['b', 2n],
				]),
				arraySize: undefined,
				bitWidth: undefined,
			},
		]);
	});
});
