import { Command, Option, UsageError } from "clipanion";
import t from "typanion";

export class LiveCommand extends Command {
	static paths = [["live"]];

	static usage = Command.Usage({
		description: "Convert live NT data to MCAP",
		examples: [["Start a live MCAP server for team 581", "$0 live --team 581"]],
	});

	team = Option.String({
		validator: t.cascade(
			t.isNumber(),
			t.isInteger(),
			t.isInInclusiveRange(1, 20000),
		),
		required: false,
		name: "team number",
	});

	ntServer = Option.String({
		required: false,
		name: "NT server",
	});

	async execute(): Promise<number | void> {
		if (this.team === undefined && this.ntServer === undefined) {
			throw new UsageError("Must specify either --team or --nt-server");
		}
	}
}
