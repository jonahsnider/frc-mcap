import assert from 'node:assert/strict';
import type { EnumSpecification } from './types';

const ENUM_SPECIFICATION_REGEXP = /^(?:enum\s?)?{\s?(?:(\w+)\s?=\s?(\d+),?)*\s?}$/;
const ENUM_PAIR_REGEXP = /\s?(?:(\w+)\s?=\s?(\d+),?)*\s?/g;

export function parseEnumSpecification(declaration: string): EnumSpecification {
	const result = new Map<string, bigint>();

	const match = declaration.match(ENUM_SPECIFICATION_REGEXP);
	if (!match) {
		throw new RangeError(`Invalid enum specification: ${declaration}`);
	}

	return result;
}
