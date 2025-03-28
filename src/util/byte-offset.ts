export class ByteOffset {
	constructor(private offset = 0) {}

	get(): number {
		return this.offset;
	}

	advance(bytes: number): ByteOffset {
		this.offset += bytes;
		return this;
	}

	advance8(): ByteOffset {
		return this.advance(1);
	}

	advance16(): ByteOffset {
		return this.advance(2);
	}

	advance32(): ByteOffset {
		return this.advance(4);
	}

	advance64(): ByteOffset {
		return this.advance(8);
	}

	canRead(buffer: Uint8Array, wantedBytes: number): boolean {
		return this.offset + wantedBytes <= buffer.byteLength;
	}
}
