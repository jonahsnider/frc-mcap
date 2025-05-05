import { StructDependencyGraph } from './struct-dependency-graph.js';
import type { WpilogRecord } from './types.js';

export class StructDecodeQueue {
	private readonly graph = new StructDependencyGraph();
	private readonly queuedRecords = new Map<string, WpilogRecord[]>();

	constructor(private readonly onStructDefined: (structName: string, records: WpilogRecord[]) => void) {}

	queueStructRecord(structName: string, record: WpilogRecord): void {
		const existing = this.queuedRecords.get(structName);

		if (existing) {
			existing.push(record);
		} else {
			this.queuedRecords.set(structName, [record]);
		}
	}

	/**
	 * Register a struct schema once it's been defined.
	 * @param structName The name of the struct to register.
	 * @param innerStructNames The names of the structs that must be defined before this struct can be decoded.
	 */
	registerSchema(structName: string, innerStructNames: Iterable<string>): void {
		// TODO: In the future, the graph can maybe just return the list of structs that have been affected by the new schema
		this.graph.registerSchema(structName, innerStructNames);
		this.checkDecodableStructs();
	}

	private checkDecodableStructs(): void {
		for (const structName of this.graph.getDecodableStructs()) {
			const records = this.queuedRecords.get(structName);

			if (records) {
				this.onStructDefined(structName, records);
				this.queuedRecords.delete(structName);
			}
		}
	}
}
