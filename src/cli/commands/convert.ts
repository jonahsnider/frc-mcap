import { Command, Option } from 'clipanion';

export class ConvertCommand extends Command {
	static paths = [['convert']];

	static usage = Command.Usage({
		description: 'Convert WPILOG files to MCAP',
		examples: [['Convert a WPILOG file', '$0 convert ./my-log.wpilog']],
	});

	input = Option.Rest({ required: 1, name: 'input file(s)' });

	async execute(): Promise<void> {}
}
