import { describe, expect, test } from 'bun:test';
import { parseEnumSpecification } from './parser';

describe('parse enum specification', () => {
	test('parse empty enum specification', () => {
		expect(parseEnumSpecification('enum{}')).toStrictEqual(new Map());
	});

	test('parse enum specification with one value', () => {
		expect(parseEnumSpecification('enum { a = 1 }')).toStrictEqual(new Map([['a', 1n]]));
	});

	test('parse enum specification with multiple values', () => {
		expect(parseEnumSpecification('enum{a=1,b=2,}')).toStrictEqual(
			new Map([
				['a', 1n],
				['b', 2n],
			]),
		);
	});

	test('parse enum specification with no enum keyword', () => {
		expect(parseEnumSpecification('{a=1}')).toStrictEqual(new Map([['a', 1n]]));
	});

	test('reject enum specification with no {}', () => {
		expect(() => parseEnumSpecification('enum')).toThrowError();
	});

	test('reject enum specification with missing identifier', () => {
		expect(() => parseEnumSpecification('enum{=2}')).toThrowError();
	});

	test('reject enum specification with missing values', () => {
		expect(() => parseEnumSpecification('enum{a=1,b,c}')).toThrowError();
	});
});
