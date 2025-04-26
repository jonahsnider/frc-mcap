import type { ICstNodeVisitor } from '../generated';
import { parser } from '../parser';
import type { ICstNodeVisitorWithDefaults } from '../types';

export const BaseStructVisitor = parser.getBaseCstVisitorConstructor<unknown, unknown>() as {
	// biome-ignore lint/suspicious/noExplicitAny: This is copied from Chevrotain
	new (...args: any[]): ICstNodeVisitor<unknown, unknown>;
};
export const BaseStructVisitorWithDefaults = parser.getBaseCstVisitorConstructorWithDefaults<unknown, unknown>() as {
	new (
		// biome-ignore lint/suspicious/noExplicitAny: This is copied from Chevrotain
		...args: any[]
	): ICstNodeVisitorWithDefaults<unknown, unknown>;
};
