import assert from 'node:assert/strict';
import { ByteOffset } from '../util/byte-offset.js';
import type { StructDecodeQueue } from './struct-decode-queue.js';
import { StructRegistry } from './struct-registry.js';
import {
	type WpilogFinishControlRecord,
	type WpilogRecord,
	WpilogRecordType,
	type WpilogStartControlRecord,
} from './types.js';
import { WpilogReader } from './wpilog-reader.js';

export class PayloadParser {
	public static readonly STRUCT_PREFIX = 'struct:';
	public static readonly STRUCT_ARRAY_SUFFIX = '[]';

	private static normalizeEntryName(rawName: string): string {
		if (rawName.startsWith('/')) {
			return rawName;
		}

		return `/${rawName}`;
	}

	private static byteToBoolean(byte: number): boolean {
		switch (byte) {
			case 0:
				return false;
			case 1:
				return true;
			default:
				throw new RangeError(`Invalid boolean value ${byte}`);
		}
	}

	public readonly structRegistry;

	constructor(structDecodeQueue: StructDecodeQueue) {
		this.structRegistry = new StructRegistry(structDecodeQueue);
	}

	private readonly context = new Map<
		WpilogStartControlRecord['entryId'],
		Pick<WpilogStartControlRecord, 'entryName' | 'entryType' | 'entryMetadata'>
	>();

	registerEntry(payload: WpilogStartControlRecord): void {
		this.context.set(payload.entryId, payload);
	}

	unregisterEntry(payload: WpilogFinishControlRecord): void {
		this.context.delete(payload.entryId);
	}

	parse(rawRecord: WpilogRecord): WpilogRecord | string {
		assert(rawRecord.type === WpilogRecordType.Raw);

		const view = new DataView(rawRecord.payload.buffer, rawRecord.payload.byteOffset, rawRecord.payload.byteLength);

		const recordContext = this.context.get(rawRecord.entryId);

		if (recordContext === undefined) {
			throw new RangeError(`No type registered for entry ID ${rawRecord.entryId}`);
		}

		switch (recordContext.entryType) {
			case WpilogRecordType.Boolean:
				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: PayloadParser.normalizeEntryName(recordContext.entryName),
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.Boolean,
					payload: PayloadParser.byteToBoolean(view.getUint8(0)),
				};
			case WpilogRecordType.Int64:
				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: PayloadParser.normalizeEntryName(recordContext.entryName),
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.Int64,
					payload: view.getBigInt64(0, true),
				};
			case WpilogRecordType.Float:
				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: PayloadParser.normalizeEntryName(recordContext.entryName),
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.Float,
					payload: view.getFloat32(0, true),
				};
			case WpilogRecordType.Double:
				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: PayloadParser.normalizeEntryName(recordContext.entryName),
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.Double,
					payload: view.getFloat64(0, true),
				};
			case WpilogRecordType.StructSchema:
			case WpilogRecordType.String: {
				const structName = recordContext.entryName.slice('/.schema/'.length + PayloadParser.STRUCT_PREFIX.length);
				const payload = WpilogReader.TEXT_DECODER.decode(rawRecord.payload);

				if (recordContext.entryType === WpilogRecordType.StructSchema) {
					this.structRegistry.register(structName, payload);
				}

				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: PayloadParser.normalizeEntryName(recordContext.entryName),
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.String,
					payload: payload,
				};
			}
			case WpilogRecordType.BooleanArray: {
				const payload: boolean[] = [];

				for (let i = 0; i < rawRecord.payload.byteLength; i++) {
					payload.push(PayloadParser.byteToBoolean(view.getUint8(i)));
				}

				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: PayloadParser.normalizeEntryName(recordContext.entryName),
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.BooleanArray,
					payload,
				};
			}
			case WpilogRecordType.Int64Array: {
				const payload: bigint[] = [];

				for (let i = 0; i < rawRecord.payload.byteLength; i += 8) {
					payload.push(view.getBigUint64(i, true));
				}

				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: PayloadParser.normalizeEntryName(recordContext.entryName),
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.Int64Array,
					payload,
				};
			}
			case WpilogRecordType.FloatArray: {
				const payload: number[] = [];

				for (let i = 0; i < rawRecord.payload.byteLength; i += 4) {
					payload.push(view.getFloat32(i, true));
				}

				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: PayloadParser.normalizeEntryName(recordContext.entryName),
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.FloatArray,
					payload,
				};
			}
			case WpilogRecordType.DoubleArray: {
				const payload: number[] = [];

				for (let i = 0; i < rawRecord.payload.byteLength; i += 8) {
					payload.push(view.getFloat64(i, true));
				}

				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: PayloadParser.normalizeEntryName(recordContext.entryName),
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.DoubleArray,
					payload,
				};
			}
			case WpilogRecordType.StringArray: {
				const payload: string[] = [];
				const offset = new ByteOffset();

				const arrayLength = view.getUint32(offset.get(), true);
				offset.advance32();

				for (let i = 0; i < arrayLength; i++) {
					const stringLength = view.getUint32(offset.get(), true);
					offset.advance32();
					const string = WpilogReader.TEXT_DECODER.decode(
						rawRecord.payload.subarray(offset.get(), offset.get() + stringLength),
					);
					offset.advance(stringLength);
					payload.push(string);
				}

				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: PayloadParser.normalizeEntryName(recordContext.entryName),
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.StringArray,
					payload,
				};
			}
			case WpilogRecordType.Raw: {
				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: PayloadParser.normalizeEntryName(recordContext.entryName),
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.Raw,
					payload: rawRecord.payload,
				};
			}
			default: {
				// TODO: Unknown types aren't necessarily structs (ex. a JSON string)

				if (recordContext.entryType.endsWith(PayloadParser.STRUCT_ARRAY_SUFFIX)) {
					const normalizedStructName = recordContext.entryType.slice(PayloadParser.STRUCT_PREFIX.length);
					const decodedOrBlockingStructName = this.structRegistry.decodeArray(normalizedStructName, rawRecord.payload);

					if (typeof decodedOrBlockingStructName === 'string') {
						return decodedOrBlockingStructName;
					}

					return {
						entryId: rawRecord.entryId,
						timestamp: rawRecord.timestamp,
						name: PayloadParser.normalizeEntryName(recordContext.entryName),
						metadata: recordContext.entryMetadata,
						type: WpilogRecordType.StructArray,
						structName: normalizedStructName,
						payload: decodedOrBlockingStructName,
					};
				}

				const normalizedStructName = recordContext.entryType.slice(PayloadParser.STRUCT_PREFIX.length);
				const decodedOrBlockingStructName = this.structRegistry.decode(normalizedStructName, rawRecord.payload);

				if (typeof decodedOrBlockingStructName === 'string') {
					return decodedOrBlockingStructName;
				}

				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: PayloadParser.normalizeEntryName(recordContext.entryName),
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.Struct,
					structName: normalizedStructName,
					payload: decodedOrBlockingStructName,
				};
			}
		}
	}
}
