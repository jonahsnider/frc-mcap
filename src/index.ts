#!/usr/bin/env bun

import { Builtins, Cli } from 'clipanion';
import { ConvertCommand } from './cli/commands/convert.js';
import { LiveCommand } from './cli/commands/live.js';
import { CLI_CONFIG } from './cli/config.js';

const cli = new Cli(CLI_CONFIG);

cli.register(ConvertCommand);
cli.register(LiveCommand);

cli.register(Builtins.HelpCommand);
cli.register(Builtins.VersionCommand);

cli.runExit(process.argv.slice(2));
