import { McapWriter as Mcap } from '@mcap/core';
import msgpack from '@msgpack/msgpack';
import type { FileSink } from 'bun';
import { type WpilogRecord, WpilogRecordType } from '../wpilog/types';
import { FileSinkWritable } from './file-sink-writable';
import { jsonBigIntReplacer } from './json-replacer';
import { SchemaRegistry } from './schema-registry';
import { McapMessageEncoding, McapSchemaEncoding } from './types';

export class McapWriter {
	private static readonly TEXT_ENCODER = new TextEncoder();
	private readonly writer: Mcap;
	private readonly schemaRegistry: SchemaRegistry = new SchemaRegistry();
	private readonly schemas: Map<string, number> = new Map();
	private readonly channels: Map<number, number> = new Map();

	constructor(
		private readonly output: FileSink,
		/** The time the log was created, used to calculate timestamps. */
		private readonly logCreation: Date,
	) {
		this.writer = new Mcap({
			writable: new FileSinkWritable(output),
			useStatistics: true,
			useChunks: true,
			useChunkIndex: true,
			useMessageIndex: true,
		});
	}

	async write(records: AsyncIterable<WpilogRecord>): Promise<void> {
		await this.writer.start({ library: 'frc-mcap', profile: '' });

		for await (const record of records) {
			if (record.type === WpilogRecordType.ControlRecord) {
				continue;
			}

			const channel = await this.getChannel(record);

			const timestampMilliseconds = BigInt(this.logCreation.getTime()) + record.timestamp / 1_000n;
			const timestampNanos = timestampMilliseconds * 1_000_000n;

			const message = {
				value: record.payload,
			};

			// TODO: This needs to be better optimized
			// Super hacky workaround for bigint validation/serialization
			this.schemaRegistry.validateMessage(record.type, JSON.parse(JSON.stringify(message, jsonBigIntReplacer)));

			const data =
				record.type === WpilogRecordType.Raw
					? msgpack.encode(message, { useBigInt64: true })
					: McapWriter.TEXT_ENCODER.encode(JSON.stringify(message, jsonBigIntReplacer));

			await this.writer.addMessage({
				channelId: channel,
				publishTime: timestampNanos,
				logTime: timestampNanos,
				sequence: 0,
				data,
			});
		}

		await this.writer.end();
	}

	private async getChannel(record: Exclude<WpilogRecord, { type: WpilogRecordType.ControlRecord }>): Promise<number> {
		const existing = this.channels.get(record.entryId);

		if (existing !== undefined) {
			return existing;
		}

		const schema = await this.getSchema(record.type);

		const createdChannel = await this.writer.registerChannel({
			topic: record.name,
			// TODO: Include metadata, make a helper function that returns a Map from a record (with error handling for invalid json)
			// metadata: new Map(Object.entries(JSON.parse(record.metadata))),
			metadata: new Map(),
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

		const jsonSchema = this.schemaRegistry.getSchema(type);

		const createdSchema = await this.writer.registerSchema({
			encoding: McapSchemaEncoding.JsonSchema,
			name: type,
			data: McapWriter.TEXT_ENCODER.encode(JSON.stringify(jsonSchema)),
		});

		this.schemas.set(type, createdSchema);
		return createdSchema;
	}
}
