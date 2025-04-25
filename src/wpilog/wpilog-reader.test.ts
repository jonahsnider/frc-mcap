import { describe, expect, test } from 'bun:test';
import { InputStream } from '../util/input-stream';
import { WpilogReader } from './wpilog-reader';

test('parse record header length', async () => {
	const buffer = new Uint8Array([0x20]);

	// biome-ignore lint/complexity/useLiteralKeys: This is to access a private field
	const result = await WpilogReader['readRecordHeaderLength'](new InputStream(new Blob([buffer]).stream()));

	expect(result).toStrictEqual({
		entryIdLength: 1,
		payloadSizeLength: 1,
		timestampLength: 3,
		spareBit: 0,
	});
});

test('parse header', async () => {
	const buffer = new Uint8Array([0x57, 0x50, 0x49, 0x4c, 0x4f, 0x47, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00]);

	// biome-ignore lint/complexity/useLiteralKeys: This is to access a private field
	const result = await WpilogReader['readHeader'](new InputStream(new Blob([buffer]).stream()), 'test.wpilog');

	expect(result).toStrictEqual({
		version: {
			major: 1,
			minor: 0,
		},
		extraHeader: '',
	});
});

describe('parse record entry ID', async () => {
	test('ID length 1', async () => {
		const buffer = new Uint8Array([0x01]);

		// biome-ignore lint/complexity/useLiteralKeys: This is to access a private field
		const result = await WpilogReader['readRecordEntryId'](new InputStream(new Blob([buffer]).stream()), {
			entryIdLength: 1,
			payloadSizeLength: 1,
			timestampLength: 3,
			spareBit: 0,
		});

		expect(result).toBe(1);
	});

	test('ID length 2', async () => {
		const buffer = new Uint8Array([0x01, 0x00]);

		// biome-ignore lint/complexity/useLiteralKeys: This is to access a private field
		const result = await WpilogReader['readRecordEntryId'](new InputStream(new Blob([buffer]).stream()), {
			entryIdLength: 2,
			payloadSizeLength: 1,
			timestampLength: 3,
			spareBit: 0,
		});

		expect(result).toBe(1);
	});

	test('ID length 3', async () => {
		const buffer = new Uint8Array([0x01, 0x00, 0x00]);

		// biome-ignore lint/complexity/useLiteralKeys: This is to access a private field
		const result = await WpilogReader['readRecordEntryId'](new InputStream(new Blob([buffer]).stream()), {
			entryIdLength: 3,
			payloadSizeLength: 1,
			timestampLength: 3,
			spareBit: 0,
		});

		expect(result).toBe(1);
	});

	test('ID length 4', async () => {
		const buffer = new Uint8Array([0x01, 0x00, 0x00, 0x00]);

		// biome-ignore lint/complexity/useLiteralKeys: This is to access a private field
		const result = await WpilogReader['readRecordEntryId'](new InputStream(new Blob([buffer]).stream()), {
			entryIdLength: 4,
			payloadSizeLength: 1,
			timestampLength: 3,
			spareBit: 0,
		});

		expect(result).toBe(1);
	});
});
