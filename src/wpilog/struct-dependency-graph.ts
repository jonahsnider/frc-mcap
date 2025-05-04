import assert from 'node:assert/strict';
import { concatIterables } from '@jonahsnider/util';
import { KnownStructTypeName } from '../wpilib-struct/types';

const EMPTY_SET: Set<never> = new Set();

export class StructDependencyGraph {
	private readonly allDependencies = new Map<string, Set<string>>(
		Object.values(KnownStructTypeName).map((type) => [type, EMPTY_SET]),
	);

	registerSchema(name: string, innerStructNames: Iterable<string>): void {
		const existing = this.allDependencies.get(name);

		if (existing) {
			for (const innerStructName of innerStructNames) {
				existing.add(innerStructName);
			}
		} else {
			this.allDependencies.set(name, new Set(concatIterables([name], innerStructNames)));
		}
	}

	getDependencies(name: string): ReadonlySet<string> {
		const result = new Set<string>();

		const queue = [name];

		while (queue.length > 0) {
			const current = queue.pop();
			assert(current);

			if (result.has(current)) {
				continue;
			}

			result.add(current);

			const dependencies = this.allDependencies.get(current);

			if (dependencies) {
				queue.push(...dependencies);
			}
		}

		return result;
	}

	getDecodableStructs(): Iterable<string> {
		return this.allDependencies.keys().filter((structName) => this.getMissingDependencies(structName).size === 0);
	}

	getMissingDependencies(name: string): Set<string> {
		const dependencies = this.getDependencies(name);

		return dependencies.difference(this.allDependencies);
	}
}
