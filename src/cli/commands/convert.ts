import assert from 'node:assert/strict';
import path from 'node:path';
import { Command, Option, UsageError } from 'clipanion';
import { Temporal } from 'temporal-polyfill';
import { McapWriter } from '../../mcap/mcap-writer';
import { changeExtension } from '../../util/path';
import { WpilogReader } from '../../wpilog/wpilog-reader';

export class ConvertCommand extends Command {
	static paths = [['convert']];

	static usage = Command.Usage({
		description: 'Convert WPILOG files to MCAP',
		examples: [['Convert a WPILOG file', '$0 convert ./my-log.wpilog']],
	});

	inputs = Option.Rest({ required: 1, name: 'input file(s)' });

	async execute(): Promise<void> {
		await Promise.all(
			this.inputs.map(async (input) => {
				const inputFile = Bun.file(input);

				assert(inputFile.name);
				if (path.extname(inputFile.name) !== '.wpilog') {
					throw new UsageError('Input file must be a WPILOG file');
				}

				const outputFile = Bun.file(changeExtension(inputFile.name, '.wpilog', '.mcap'));

				const reader = new WpilogReader(inputFile);

				// Bun FileSink won't clear out excess bytes already present in the file, so we delete before creating the writer
				try {
					await outputFile.unlink();
				} catch (error) {
					if (error instanceof Error && 'code' in error && typeof error.code === 'string' && error.code !== 'ENOENT') {
						throw error;
					}
				}

				const fileMetadata = await inputFile.stat();

				const writer = new McapWriter(
					outputFile.writer(),
					Temporal.Instant.fromEpochMilliseconds(fileMetadata.birthtime.getTime()),
					reader.payloadParser.structRegistry,
				);

				await writer.write(reader.records());
			}),
		);
	}
}
