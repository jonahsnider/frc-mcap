import { Builtins, Cli } from "clipanion";
import { ConvertCommand } from "./cli/commands/convert";
import { LiveCommand } from "./cli/commands/live";
import { CLI_CONFIG } from "./cli/config";

const cli = new Cli(CLI_CONFIG);

cli.register(ConvertCommand);
cli.register(LiveCommand);

cli.register(Builtins.HelpCommand);
cli.register(Builtins.VersionCommand);

cli.runExit(process.argv.slice(2));
