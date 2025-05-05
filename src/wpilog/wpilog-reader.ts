import assert from 'node:assert/strict';
import type { BunFile } from 'bun';
import { UsageError } from 'clipanion';
import { ByteOffset } from '../util/byte-offset.js';
import { InputStream, StreamFinishedError } from '../util/input-stream.js';
import { PayloadParser } from './payload-parser.js';
import { StructDecodeQueue } from './struct-decode-queue.js';
import {
	type WpilogControlRecordPayload,
	WpilogControlRecordType,
	type WpilogHeader,
	type WpilogRecord,
	WpilogRecordType,
} from './types.js';

type RecordHeaderLength = {
	entryIdLength: number;
	payloadSizeLength: number;
	timestampLength: number;
	spareBit: number;
};

export class WpilogReader {
	static readonly TEXT_DECODER = new TextDecoder();
	private static readonly MAGIC = new Uint8Array(Buffer.from('WPILOG', 'ascii'));

	private static async readHeader(buffer: InputStream, fileName: string): Promise<WpilogHeader> {
		const magic = await buffer.readBytesAndAdvance(WpilogReader.MAGIC.byteLength);
		assert.deepEqual(magic, WpilogReader.MAGIC, new UsageError(`${fileName} is not a WPILOG file`));

		const chunk = await buffer.readBytesAndAdvance(1 + 1 + 4);
		const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);

		const versionMinor = view.getUint8(0);
		const versionMajor = view.getUint8(0 + 1);
		const extraHeaderLength = view.getUint32(0 + 1 + 1, true);
		const extraHeader = await buffer.readBytesAndAdvance(extraHeaderLength);

		return {
			version: {
				major: versionMajor,
				minor: versionMinor,
			},
			extraHeader: WpilogReader.TEXT_DECODER.decode(extraHeader),
		};
	}

	private static async readRecordHeaderLength(buffer: InputStream): Promise<RecordHeaderLength> {
		const chunk = await buffer.readBytesAndAdvance(1);
		const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
		const bitfield = view.getUint8(0);

		return {
			entryIdLength: 1 + (bitfield & 0b11),
			payloadSizeLength: 1 + ((bitfield >> 2) & 0b11),
			timestampLength: 1 + ((bitfield >> 4) & 0b111),
			spareBit: (bitfield >> 7) & 0b1,
		};
	}

	private static async readRecordEntryId(buffer: InputStream, headerLength: RecordHeaderLength): Promise<number> {
		const chunk = await buffer.readBytesAndAdvance(headerLength.entryIdLength);
		const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);

		switch (headerLength.entryIdLength) {
			case 1:
				return view.getUint8(0);

			case 2:
				return view.getUint16(0, true);
			case 3: {
				const byte0 = view.getUint8(0);
				const byte1 = view.getUint8(1);
				const byte2 = view.getUint8(2);

				return (byte2 << 16) | (byte1 << 8) | byte0;
			}
			case 4:
				return view.getUint32(0, true);
			default:
				throw new RangeError(`Invalid entry ID length ${headerLength.entryIdLength}`);
		}
	}

	private static async readRecordPayloadSize(buffer: InputStream, headerLength: RecordHeaderLength): Promise<number> {
		const chunk = await buffer.readBytesAndAdvance(headerLength.payloadSizeLength);
		const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);

		switch (headerLength.payloadSizeLength) {
			case 1:
				return view.getUint8(0);

			case 2:
				return view.getUint16(0, true);

			case 3: {
				const byte0 = view.getUint8(0);
				const byte1 = view.getUint8(1);
				const byte2 = view.getUint8(2);

				return (byte2 << 16) | (byte1 << 8) | byte0;
			}
			case 4:
				return view.getUint32(0, true);

			default:
				throw new RangeError(`Invalid payload size length ${headerLength.payloadSizeLength}`);
		}
	}

	private static async readRecordTimestamp(buffer: InputStream, headerLength: RecordHeaderLength): Promise<bigint> {
		const chunk = await buffer.readBytesAndAdvance(headerLength.timestampLength);
		const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);

		switch (headerLength.timestampLength) {
			case 1:
				return BigInt(view.getUint8(0));
			case 2:
				return BigInt(view.getUint16(0, true));
			case 3: {
				const byte0 = BigInt(view.getUint8(0));
				const byte1 = BigInt(view.getUint8(1));
				const byte2 = BigInt(view.getUint8(2));

				return (byte2 << 16n) | (byte1 << 8n) | byte0;
			}
			case 4:
				return BigInt(view.getUint32(0, true));
			case 5: {
				const byte0 = BigInt(view.getUint8(0));
				const byte1 = BigInt(view.getUint8(1));
				const byte2 = BigInt(view.getUint8(2));
				const byte3 = BigInt(view.getUint8(3));
				const byte4 = BigInt(view.getUint8(4));

				return (byte4 << 32n) | (byte3 << 24n) | (byte2 << 16n) | (byte1 << 8n) | byte0;
			}
			case 6: {
				const byte0 = BigInt(view.getUint8(0));
				const byte1 = BigInt(view.getUint8(1));
				const byte2 = BigInt(view.getUint8(2));
				const byte3 = BigInt(view.getUint8(3));
				const byte4 = BigInt(view.getUint8(4));
				const byte5 = BigInt(view.getUint8(5));

				return (byte5 << 40n) | (byte4 << 32n) | (byte3 << 24n) | (byte2 << 16n) | (byte1 << 8n) | byte0;
			}
			case 7: {
				const byte0 = BigInt(view.getUint8(0));
				const byte1 = BigInt(view.getUint8(1));
				const byte2 = BigInt(view.getUint8(2));
				const byte3 = BigInt(view.getUint8(3));
				const byte4 = BigInt(view.getUint8(4));
				const byte5 = BigInt(view.getUint8(5));
				const byte6 = BigInt(view.getUint8(6));

				return (
					(byte6 << 52n) | (byte5 << 40n) | (byte4 << 32n) | (byte3 << 24n) | (byte2 << 16n) | (byte1 << 8n) | byte0
				);
			}
			case 8:
				return BigInt(view.getBigUint64(0, true));
			default:
				throw new RangeError(`Invalid timestamp length ${headerLength.timestampLength}`);
		}
	}

	private static async readRecordPayload(buffer: InputStream, payloadSize: number): Promise<Uint8Array> {
		return await buffer.readBytesAndAdvance(payloadSize);
	}

	private static readControlRecordPayload(payload: Uint8Array): WpilogControlRecordPayload {
		const offset = new ByteOffset();
		const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);

		const type = view.getUint8(offset.get());
		offset.advance8();

		switch (type) {
			case WpilogControlRecordType.Start: {
				const entryId = view.getUint32(offset.get(), true);
				offset.advance32();
				const entryNameLength = view.getUint32(offset.get(), true);
				offset.advance32();
				const entryName = WpilogReader.TEXT_DECODER.decode(
					payload.subarray(offset.get(), offset.get() + entryNameLength),
				);
				offset.advance(entryNameLength);
				const entryTypeLength = view.getUint32(offset.get(), true);
				offset.advance32();
				const entryType = WpilogReader.TEXT_DECODER.decode(
					payload.subarray(offset.get(), offset.get() + entryTypeLength),
				);
				offset.advance(entryTypeLength);
				const entryMetadataLength = view.getUint32(offset.get(), true);
				offset.advance32();
				const entryMetadata = WpilogReader.TEXT_DECODER.decode(
					payload.subarray(offset.get(), offset.get() + entryMetadataLength),
				);
				offset.advance(entryMetadataLength);

				return {
					controlRecordType: type,
					entryId,
					entryName,
					entryType,
					entryMetadata,
				};
			}
			case WpilogControlRecordType.Finish: {
				const entryId = view.getUint32(offset.get(), true);
				offset.advance32();

				return {
					controlRecordType: type,
					entryId,
				};
			}
			case WpilogControlRecordType.SetMetadata: {
				const entryId = view.getUint32(offset.get(), true);
				offset.advance32();
				const entryMetadataLength = view.getUint32(offset.get(), true);
				offset.advance32();
				const entryMetadata = payload.subarray(offset.get(), offset.get() + entryMetadataLength).toString();
				offset.advance(entryMetadataLength);

				return {
					controlRecordType: type,
					entryId,
					entryMetadata,
				};
			}
			default:
				throw new RangeError(`Invalid control record type ${type}`);
		}
	}

	private readonly structDecodeQueue = new StructDecodeQueue((structName, records) => {
		this.asyncDecodedStructs.push(...records);
	});
	public readonly payloadParser = new PayloadParser(this.structDecodeQueue);

	private readonly asyncDecodedStructs: WpilogRecord[] = [];
	private header: WpilogHeader | undefined;

	constructor(private readonly file: BunFile) {}

	async *records(): AsyncGenerator<WpilogRecord> {
		const stream: ReadableStream<Uint8Array> = this.file.stream();

		const inputStream = new InputStream(stream);

		if (!this.header) {
			this.header = await WpilogReader.readHeader(inputStream, this.file.name ?? '(unknown file)');
		}

		while (true) {
			let recordHeaderLength: RecordHeaderLength;

			// We only catch the stream finished error here, at the start of the next record
			// Otherwise we might conceal a bug partway through parsing a record
			try {
				recordHeaderLength = await WpilogReader.readRecordHeaderLength(inputStream);
			} catch (error) {
				if (error instanceof StreamFinishedError) {
					return;
				}

				throw error;
			}

			const entryId = await WpilogReader.readRecordEntryId(inputStream, recordHeaderLength);
			const payloadSize = await WpilogReader.readRecordPayloadSize(inputStream, recordHeaderLength);
			const timestamp = await WpilogReader.readRecordTimestamp(inputStream, recordHeaderLength);
			const payload = await WpilogReader.readRecordPayload(inputStream, payloadSize);

			if (entryId === 0) {
				const controlRecordPayload = WpilogReader.readControlRecordPayload(payload);

				switch (controlRecordPayload.controlRecordType) {
					case WpilogControlRecordType.Start:
						this.payloadParser.registerEntry(controlRecordPayload);
						break;
					case WpilogControlRecordType.Finish:
						this.payloadParser.unregisterEntry(controlRecordPayload);
						break;
				}

				yield {
					entryId,
					timestamp,
					type: WpilogRecordType.ControlRecord,
					payload: controlRecordPayload,
				};
			} else {
				const partialRecord: WpilogRecord = {
					entryId,
					timestamp,
					type: WpilogRecordType.Raw,
					payload,
					// These will be populated by the payload parser
					name: '',
					metadata: '',
				};
				const parsedOrBlockingStructName = this.payloadParser.parse(partialRecord);

				if (typeof parsedOrBlockingStructName === 'string') {
					// Can't decode struct until another schema is defined
				} else {
					yield parsedOrBlockingStructName;
				}
			}

			yield* this.asyncDecodedStructs;
			this.asyncDecodedStructs.length = 0;
		}
	}
}
