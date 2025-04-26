import type { CstNode, ICstVisitor, IToken } from "chevrotain";

export interface StructSpecificationCstNode extends CstNode {
  name: "structSpecification";
  children: StructSpecificationCstChildren;
}

export type StructSpecificationCstChildren = {
  declaration?: DeclarationCstNode[];
  Semicolon?: IToken[];
};

export interface DeclarationCstNode extends CstNode {
  name: "declaration";
  children: DeclarationCstChildren;
}

export type DeclarationCstChildren = {
  enumSpecification?: EnumSpecificationCstNode[];
  optionalWhitespace: OptionalWhitespaceCstNode[];
  typeName: TypeNameCstNode[];
  bitFieldDeclaration?: BitFieldDeclarationCstNode[];
  standardDeclaration?: StandardDeclarationCstNode[];
};

export interface StandardDeclarationCstNode extends CstNode {
  name: "standardDeclaration";
  children: StandardDeclarationCstChildren;
}

export type StandardDeclarationCstChildren = {
  optionalWhitespace: OptionalWhitespaceCstNode[];
  arraySize?: ArraySizeCstNode[];
};

export interface BitFieldDeclarationCstNode extends CstNode {
  name: "bitFieldDeclaration";
  children: BitFieldDeclarationCstChildren;
}

export type BitFieldDeclarationCstChildren = {
  WhiteSpace: IToken[];
  Identifier: IToken[];
  Colon: IToken[];
  optionalWhitespace: OptionalWhitespaceCstNode[];
  Integer: IToken[];
};

export interface ArraySizeCstNode extends CstNode {
  name: "arraySize";
  children: ArraySizeCstChildren;
}

export type ArraySizeCstChildren = {
  ArraySizeOpen: IToken[];
  optionalWhitespace: (OptionalWhitespaceCstNode)[];
  Integer: IToken[];
  ArraySizeClose: IToken[];
};

export interface EnumSpecificationCstNode extends CstNode {
  name: "enumSpecification";
  children: EnumSpecificationCstChildren;
}

export type EnumSpecificationCstChildren = {
  EnumKeyword?: IToken[];
  optionalWhitespace: (OptionalWhitespaceCstNode)[];
  EnumOpen: IToken[];
  enumMember?: EnumMemberCstNode[];
  Comma?: IToken[];
  EnumClose: IToken[];
};

export interface EnumMemberCstNode extends CstNode {
  name: "enumMember";
  children: EnumMemberCstChildren;
}

export type EnumMemberCstChildren = {
  optionalWhitespace: (OptionalWhitespaceCstNode)[];
  Identifier: IToken[];
  Equals: IToken[];
  Integer: IToken[];
};

export interface OptionalWhitespaceCstNode extends CstNode {
  name: "optionalWhitespace";
  children: OptionalWhitespaceCstChildren;
}

export type OptionalWhitespaceCstChildren = {
  WhiteSpace?: IToken[];
};

export interface TypeNameCstNode extends CstNode {
  name: "typeName";
  children: TypeNameCstChildren;
}

export type TypeNameCstChildren = {
  TypeNameBoolean?: IToken[];
  TypeNameChar?: IToken[];
  TypeNameInt8?: IToken[];
  TypeNameInt16?: IToken[];
  TypeNameInt32?: IToken[];
  TypeNameInt64?: IToken[];
  TypeNameUint8?: IToken[];
  TypeNameUint16?: IToken[];
  TypeNameUint32?: IToken[];
  TypeNameUint64?: IToken[];
  TypeNameFloat32?: IToken[];
  TypeNameFloat64?: IToken[];
  Identifier?: IToken[];
};

export interface ICstNodeVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  structSpecification(children: StructSpecificationCstChildren, param?: IN): OUT;
  declaration(children: DeclarationCstChildren, param?: IN): OUT;
  standardDeclaration(children: StandardDeclarationCstChildren, param?: IN): OUT;
  bitFieldDeclaration(children: BitFieldDeclarationCstChildren, param?: IN): OUT;
  arraySize(children: ArraySizeCstChildren, param?: IN): OUT;
  enumSpecification(children: EnumSpecificationCstChildren, param?: IN): OUT;
  enumMember(children: EnumMemberCstChildren, param?: IN): OUT;
  optionalWhitespace(children: OptionalWhitespaceCstChildren, param?: IN): OUT;
  typeName(children: TypeNameCstChildren, param?: IN): OUT;
}
