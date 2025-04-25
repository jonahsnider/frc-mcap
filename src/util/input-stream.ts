export class StreamFinishedError extends Error {
	constructor(bytesRead: number) {
		super(`Reached end of stream after reading ${bytesRead} bytes`);
	}
}

export class InputStream {
	private readonly reader: Bun.ReadableStreamReader<Uint8Array>;
	private bytesRead = 0;
	private buffer: Uint8Array = new Uint8Array();

	constructor(stream: ReadableStream<Uint8Array>) {
		this.reader = stream.getReader() as Bun.ReadableStreamReader<Uint8Array>;
	}

	async readBytesAndAdvance(length: number): Promise<Uint8Array> {
		// Read more bytes from the stream if needed
		while (this.buffer.byteLength < length) {
			const chunk = await this.reader.read();

			if (chunk.done) {
				throw new StreamFinishedError(this.bytesRead);
			}

			// TODO: This can be better optimized
			const newBuffer = new Uint8Array(this.buffer.byteLength + chunk.value.byteLength);
			newBuffer.set(this.buffer);
			newBuffer.set(chunk.value, this.buffer.byteLength);
			this.buffer = newBuffer;
		}

		// The existing buffer already has the requested length
		return this.readAndAdvanceFromBuffer(length);
	}

	private readAndAdvanceFromBuffer(length: number): Uint8Array {
		// TODO: This does a lot of unnecessary copying
		const result = this.buffer.slice(0, length);
		this.buffer = this.buffer.slice(length);
		this.bytesRead += length;
		return result;
	}
}
