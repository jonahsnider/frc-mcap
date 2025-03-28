import { Command, Option } from 'clipanion';
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
				const reader = new WpilogReader(Bun.file(input));

				for await (const record of reader.records()) {
					console.log(record.payload);
				}
			}),
		);
	}
}
