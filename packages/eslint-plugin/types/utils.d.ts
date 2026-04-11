export type NodeLike = {
    type: string;
};
type IdentifierNode = NodeLike & {
    type: "Identifier";
    name: string;
};
type LiteralNode = NodeLike & {
    type: "Literal";
    value: string | number | boolean | null;
};
export type MemberExpressionNode = NodeLike & {
    type: "MemberExpression";
    computed: boolean;
    object: unknown;
    property: unknown;
};
export type PropertyKeyNode = IdentifierNode | LiteralNode | null | undefined;
export type PropertyNode = NodeLike & {
    type: "Property";
    computed: boolean;
    kind: string;
    method: boolean;
    key: PropertyKeyNode;
    value: NodeLike;
};
export type SpreadElementNode = NodeLike & {
    type: "SpreadElement";
};
export type ObjectExpressionNode = NodeLike & {
    type: "ObjectExpression";
    properties: Array<PropertyNode | SpreadElementNode>;
};
export type TSPropertySignatureNode = NodeLike & {
    type: "TSPropertySignature";
    computed: boolean;
    key: PropertyKeyNode;
};
export type TypeBodyNode = {
    members: TSPropertySignatureNode[];
};
export type CallExpressionNode = {
    callee: unknown;
    arguments: unknown[];
};
export declare function isObjectExpressionNode(node: unknown): node is ObjectExpressionNode;
export declare function isMemberExpressionNode(node: unknown): node is MemberExpressionNode;
export declare function isCallExpressionNode(node: unknown): node is CallExpressionNode;
export declare function isTypeBodyNode(node: unknown): node is TypeBodyNode;
export declare function getPropertyName(node: PropertyKeyNode): string | null;
export declare function isCreateErrorCallee(node: unknown): boolean;
export declare function isNumericLiteral(node: unknown): boolean;
export declare function isNoneIdentifier(node: unknown): boolean;
export declare function looksLikeErrorReference(node: unknown): boolean;
export {};
