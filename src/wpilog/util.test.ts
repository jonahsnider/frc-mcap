import { describe, expect, test } from 'bun:test';
import type { StructPayload, StructPayloadValue } from './types';
import { structPayloadToJson } from './util';

describe('struct payload to JSON', () => {
	test('Translation2d', () => {
		const payload: StructPayload = new Map([
			['x', 1.0],
			['y', 2.0],
		]);

		const json = structPayloadToJson(payload);
		expect(json).toStrictEqual({ x: 1.0, y: 2.0 });
	});

	test('Pose2d', () => {
		const payload: StructPayload = new Map<string, StructPayloadValue>([
			[
				'translation',
				new Map([
					['x', 1.0],
					['y', 2.0],
				]),
			],
			['rotation', 3.0],
		]);

		const json = structPayloadToJson(payload);
		expect(json).toStrictEqual({
			translation: { x: 1.0, y: 2.0 },
			rotation: 3.0,
		});
	});
});
