import assert from 'node:assert/strict';
import { ByteOffset } from '../util/byte-offset';
import {
	type WpilogFinishControlRecord,
	type WpilogRecord,
	WpilogRecordType,
	type WpilogStartControlRecord,
} from './types';
import { WpilogReader } from './wpilog-reader';

export class PayloadParser {
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

	parse(rawRecord: WpilogRecord): WpilogRecord {
		assert(rawRecord.type === WpilogRecordType.Raw);

		const view = new DataView(rawRecord.payload.buffer);

		const recordContext = this.context.get(rawRecord.entryId);

		if (recordContext === undefined) {
			throw new RangeError(`No type registered for entry ID ${rawRecord.entryId}`);
		}

		switch (recordContext.entryType) {
			case WpilogRecordType.Boolean:
				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: recordContext.entryName,
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.Boolean,
					payload: PayloadParser.byteToBoolean(view.getUint8(0)),
				};
			case WpilogRecordType.Int64:
				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: recordContext.entryName,
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.Int64,
					payload: view.getBigInt64(0, true),
				};
			case WpilogRecordType.Float:
				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: recordContext.entryName,
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.Float,
					payload: view.getFloat32(0, true),
				};
			case WpilogRecordType.Double:
				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: recordContext.entryName,
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.Double,
					payload: view.getFloat64(0, true),
				};
			case WpilogRecordType.String:
				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: recordContext.entryName,
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.String,
					payload: WpilogReader.TEXT_DECODER.decode(rawRecord.payload),
				};
			case WpilogRecordType.BooleanArray: {
				const payload: boolean[] = [];

				for (let i = 0; i < rawRecord.payload.byteLength; i++) {
					payload.push(PayloadParser.byteToBoolean(view.getUint8(i)));
				}

				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: recordContext.entryName,
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.BooleanArray,
					payload,
				};
			}
			case WpilogRecordType.Int64Array: {
				const payload: bigint[] = [];

				for (let i = 0; i < rawRecord.payload.byteLength; i += 4) {
					payload.push(view.getBigUint64(i, true));
				}

				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: recordContext.entryName,
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
					name: recordContext.entryName,
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
					name: recordContext.entryName,
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
					name: recordContext.entryName,
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.StringArray,
					payload,
				};
			}
			case WpilogRecordType.Raw: {
				return {
					entryId: rawRecord.entryId,
					timestamp: rawRecord.timestamp,
					name: recordContext.entryName,
					metadata: recordContext.entryMetadata,
					type: WpilogRecordType.Raw,
					payload: rawRecord.payload,
				};
			}
			// TODO: Handle custom types (structs)
			default:
				return rawRecord;
		}
	}
}
