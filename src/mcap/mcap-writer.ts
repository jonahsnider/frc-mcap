import { McapWriter as Mcap } from '@mcap/core';
import * as msgpack from '@msgpack/msgpack';
import type { FileSink } from 'bun';
import type { Temporal } from 'temporal-polyfill';
import { PayloadParser } from '../wpilog/payload-parser';
import type { StructRegistry } from '../wpilog/struct-registry';
import { type WpilogDataRecord, type WpilogRecord, WpilogRecordType } from '../wpilog/types';
import { structPayloadToJson } from '../wpilog/util';
import { FileSinkWritable } from './file-sink-writable';
import { jsonBigIntReplacer } from './json-replacer';
import { SchemaRegistry } from './schema-registry';
import { McapMessageEncoding, McapSchemaEncoding } from './types';

export class McapWriter {
	private static readonly TEXT_ENCODER = new TextEncoder();

	private static parseWpilogMetadata(metadata: string): Map<string, string> {
		try {
			const json = JSON.parse(metadata) as unknown;

			if (typeof json === 'object' && json !== null) {
				return new Map(Object.entries(json));
			}
		} catch {}

		return new Map([['raw_wpilog_metadata', metadata]]);
	}

	private readonly writer: Mcap;
	private readonly schemaRegistry: SchemaRegistry;
	private readonly schemas: Map<string, number> = new Map();
	private readonly channels: Map<number, number> = new Map();

	constructor(
		private readonly output: FileSink,
		/** The time the log was created, used to calculate timestamps. */
		private readonly logCreation: Temporal.Instant,
		structRegistry: StructRegistry,
	) {
		this.writer = new Mcap({
			writable: new FileSinkWritable(output),
			useStatistics: true,
			useChunks: true,
			useChunkIndex: true,
			useMessageIndex: true,
		});
		this.schemaRegistry = new SchemaRegistry(structRegistry);
	}

	async write(records: AsyncIterable<WpilogRecord>): Promise<void> {
		await this.writer.start({ library: 'frc-mcap', profile: '' });

		for await (const record of records) {
			if (record.type === WpilogRecordType.ControlRecord) {
				continue;
			}

			const channel = await this.getChannel(record);

			const entryCreation = this.logCreation.add({ microseconds: Number(record.timestamp) });

			const message = this.recordToMessage(record);

			const jsonString = JSON.stringify(message, jsonBigIntReplacer);

			// TODO: This needs to be better optimized
			// Super hacky workaround for bigint validation/serialization
			this.schemaRegistry.validateMessage(this.getTypeString(record), JSON.parse(jsonString), false);

			const data =
				record.type === WpilogRecordType.Raw
					? msgpack.encode(message, { useBigInt64: true })
					: McapWriter.TEXT_ENCODER.encode(jsonString);

			await this.writer.addMessage({
				channelId: channel,
				publishTime: entryCreation.epochNanoseconds,
				logTime: entryCreation.epochNanoseconds,
				sequence: 0,
				data,
			});
		}

		await this.writer.end();
	}

	private recordToMessage(record: WpilogDataRecord): object {
		switch (record.type) {
			case WpilogRecordType.Struct:
				return structPayloadToJson(record.payload);
			case WpilogRecordType.StructArray:
				return {
					value: record.payload.map((elementPayload) => structPayloadToJson(elementPayload)),
				};
			default:
				return {
					value: record.payload,
				};
		}
	}

	private async getChannel(record: Exclude<WpilogRecord, { type: WpilogRecordType.ControlRecord }>): Promise<number> {
		const existing = this.channels.get(record.entryId);

		if (existing !== undefined) {
			return existing;
		}

		const schema = await this.getSchema(this.getTypeString(record));

		const createdChannel = await this.writer.registerChannel({
			topic: record.name,
			metadata: McapWriter.parseWpilogMetadata(record.metadata),
			messageEncoding: record.type === WpilogRecordType.Raw ? McapMessageEncoding.Msgpack : McapMessageEncoding.Json,
			schemaId: schema,
		});

		this.channels.set(record.entryId, createdChannel);
		return createdChannel;
	}

	private async getSchema(type: string): Promise<number> {
		const existing = this.schemas.get(type);

		if (existing !== undefined) {
			return existing;
		}

		if (type === 'raw') {
			const createdSchema = await this.writer.registerSchema({
				encoding: McapSchemaEncoding.SelfDescribing,
				name: type,
				data: new Uint8Array(),
			});

			this.schemas.set(type, createdSchema);
			return createdSchema;
		}

		const jsonSchema = this.schemaRegistry.getSchema(type, false);

		const createdSchema = await this.writer.registerSchema({
			encoding: McapSchemaEncoding.JsonSchema,
			name: type,
			data: McapWriter.TEXT_ENCODER.encode(JSON.stringify(jsonSchema)),
		});

		this.schemas.set(type, createdSchema);
		return createdSchema;
	}

	private getTypeString(record: Exclude<WpilogRecord, { type: WpilogRecordType.ControlRecord }>): string {
		switch (record.type) {
			case WpilogRecordType.Struct:
			case WpilogRecordType.StructArray:
				return record.structName;
			// return record.structName + PayloadParser.STRUCT_ARRAY_SUFFIX;
			default:
				return record.type;
		}
	}
}
