export class StreamFinishedError extends Error {
	constructor() {
		super('Reached end of stream');
	}
}

export class InputStream {
	private readonly stream: ReadableStream<Uint8Array>;
	private buffer: Uint8Array = new Uint8Array();

	constructor(streamOrBuffer: ReadableStream<Uint8Array> | Uint8Array) {
		if (streamOrBuffer instanceof ReadableStream) {
			this.stream = streamOrBuffer;
		} else {
			this.stream = new ReadableStream();
			this.buffer = streamOrBuffer;
		}
	}

	async readBytesAndAdvance(length: number): Promise<Uint8Array> {
		if (this.buffer.byteLength >= length) {
			// The existing buffer already has the requested length
			return this.readAndAdvanceFromBuffer(length);
		}

		// The buffer needs to read more chunks from the stream
		for await (const chunk of this.stream) {
			const newBuffer = new Uint8Array(this.buffer.byteLength + chunk.byteLength);
			newBuffer.set(this.buffer);
			newBuffer.set(chunk, this.buffer.byteLength);
			this.buffer = newBuffer;

			if (this.buffer.byteLength >= length) {
				// The existing buffer already has the requested length
				return this.readAndAdvanceFromBuffer(length);
			}
		}

		throw new StreamFinishedError();
	}

	private readAndAdvanceFromBuffer(length: number): Uint8Array {
		const result = this.buffer.slice(0, length);
		this.buffer = this.buffer.slice(length);
		return result;
	}
}
