import type { IWritable } from '@mcap/core';
import type { FileSink } from 'bun';

export class FileSinkWritable implements IWritable {
	private bytesWritten = 0n;
	constructor(private readonly fileSink: FileSink) {}

	async write(buffer: Uint8Array): Promise<void> {
		this.fileSink.write(buffer);
		this.bytesWritten += BigInt(await this.fileSink.flush());
	}

	position(): bigint {
		return this.bytesWritten;
	}
}
