import type { StandardDeclarationCstChildren } from '../generated';
import {
	type ICstNodeVisitorWithDefaults,
	KnownStructTypeName,
	type StructDeclaration,
	type StructTypeName,
} from '../types';
import { BaseStructVisitorWithDefaults } from './visitors';

export class StandardDeclarationVisitor extends (BaseStructVisitorWithDefaults as {
	new (): ICstNodeVisitorWithDefaults<never, StructDeclaration>;
}) {
	constructor() {
		super();

		this.validateVisitor();
	}

	standardDeclaration = (children: StandardDeclarationCstChildren): StructDeclaration<StructTypeName> => {
		return {
			name: '',
			value: KnownStructTypeName.Boolean,
			enumSpecification: undefined,
			arraySize: undefined,
			bitWidth: undefined,
		};
	};
}
