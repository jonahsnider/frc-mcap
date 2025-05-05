import type { CliOptions } from 'clipanion';
import pkg from '../../package.json' with { type: 'json' };

export const CLI_CONFIG = {
	binaryLabel: 'frc-mcap',
	binaryName: 'frc-mcap',
	binaryVersion: `v${pkg.version}`,
} as const satisfies Partial<CliOptions>;
