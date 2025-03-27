import type { CliOptions } from 'clipanion';
import { version } from '../../package.json';

export const CLI_CONFIG = {
	binaryLabel: 'frc-mcap',
	binaryName: 'frc-mcap',
	binaryVersion: `v${version}`,
} as const satisfies Partial<CliOptions>;
