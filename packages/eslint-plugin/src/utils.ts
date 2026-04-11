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

type UnaryExpressionNode = NodeLike & {
  type: "UnaryExpression";
  operator: "+" | "-";
  argument: NodeLike;
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

export function isObjectExpressionNode(node: unknown): node is ObjectExpressionNode {
  return !!node && typeof node === "object" && "type" in node && node.type === "ObjectExpression" && "properties" in node && Array.isArray(node.properties);
}

function isIdentifierNode(node: unknown): node is IdentifierNode {
  return !!node && typeof node === "object" && "type" in node && node.type === "Identifier" && "name" in node && typeof node.name === "string";
}

function isLiteralNode(node: unknown): node is LiteralNode {
  return !!node && typeof node === "object" && "type" in node && node.type === "Literal" && "value" in node;
}

function isUnaryExpressionNode(node: unknown): node is UnaryExpressionNode {
  return !!node && typeof node === "object" && "type" in node && node.type === "UnaryExpression" && "operator" in node && (node.operator === "+" || node.operator === "-") && "argument" in node;
}

export function isMemberExpressionNode(node: unknown): node is MemberExpressionNode {
  return !!node && typeof node === "object" && "type" in node && node.type === "MemberExpression" && "computed" in node && typeof node.computed === "boolean" && "object" in node && "property" in node;
}

export function isCallExpressionNode(node: unknown): node is CallExpressionNode {
  return !!node && typeof node === "object" && "callee" in node && "arguments" in node && Array.isArray(node.arguments);
}

export function isTypeBodyNode(node: unknown): node is TypeBodyNode {
  return !!node && typeof node === "object" && "members" in node && Array.isArray(node.members);
}

export function getPropertyName(node: PropertyKeyNode): string | null {
  if (!node) {
    return null;
  }

  if (isIdentifierNode(node)) {
    return node.name;
  }

  if (isLiteralNode(node) && typeof node.value === "string") {
    return node.value;
  }

  return null;
}

export function isCreateErrorCallee(node: unknown): boolean {
  if (isIdentifierNode(node)) {
    return node.name === "createError";
  }

  if (isMemberExpressionNode(node) && !node.computed) {
    return getPropertyName(node.property as PropertyKeyNode) === "createError";
  }

  return false;
}

export function isNumericLiteral(node: unknown): boolean {
  if (isLiteralNode(node) && typeof node.value === "number") {
    return true;
  }

  return (
    isUnaryExpressionNode(node) &&
    isLiteralNode(node.argument) &&
    typeof node.argument.value === "number"
  );
}

export function isNoneIdentifier(node: unknown): boolean {
  return isIdentifierNode(node) && node.name === "None";
}

export function looksLikeErrorReference(node: unknown): boolean {
  if (isIdentifierNode(node)) {
    return /error/i.test(node.name);
  }

  if (isMemberExpressionNode(node) && !node.computed) {
    return (
      looksLikeErrorReference(node.object) ||
      looksLikeErrorReference(node.property)
    );
  }

  return false;
}
