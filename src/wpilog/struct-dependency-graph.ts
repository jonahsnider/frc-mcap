import assert from 'node:assert/strict';
import { KnownStructTypeName } from '../wpilib-struct/types.js';

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
			this.allDependencies.set(name, new Set(innerStructNames));
		}

		// Check for cycles in the graph using DFS
		assert(!this.hasCycle(name), new RangeError(`Cycle detected in the dependency graph for ${name}`));
	}

	private hasCycle(current: string, path = new Set<string>()): boolean {
		if (path.has(current)) {
			return true;
		}
		path.add(current);
		const directDependencies = this.allDependencies.get(current);
		if (directDependencies) {
			for (const dep of directDependencies) {
				const hasCycle = this.hasCycle(dep, path);
				if (hasCycle) {
					return hasCycle;
				}
			}
		}
		path.delete(current);

		return false;
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
		return this.allDependencies.keys().filter((structName) => {
			const dependencies = this.getDependencies(structName);

			return dependencies.isSubsetOf(this.allDependencies);
		});
	}
}
