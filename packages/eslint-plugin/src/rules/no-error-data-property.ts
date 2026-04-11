import type { Rule } from "eslint";

import type {
  ObjectExpressionNode,
  PropertyNode,
  TSPropertySignatureNode,
  TypeBodyNode
} from "../utils.js";
import {
  getPropertyName,
  isMemberExpressionNode,
  isObjectExpressionNode,
  isTypeBodyNode,
  looksLikeErrorReference
} from "../utils.js";

function hasObjectProperty(node: ObjectExpressionNode, expectedName: string): boolean {
  return node.properties.some(
    (property: PropertyNode | { type: "SpreadElement" }) =>
      property.type === "Property" &&
      !property.computed &&
      getPropertyName(property.key) === expectedName
  );
}

function hasTypeProperty(node: TypeBodyNode, expectedName: string): boolean {
  return node.members.some(
    (member: TSPropertySignatureNode) =>
      member.type === "TSPropertySignature" &&
      !member.computed &&
      getPropertyName(member.key) === expectedName
  );
}

function reportLegacyData(context: Rule.RuleContext, node: Rule.Node) {
  context.report({
    node,
    messageId: "legacyData"
  });
}

export const noErrorDataProperty: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow Clover error objects and accesses that still use the legacy data field."
    },
    schema: [],
    messages: {
      legacyData: "Use `payload` instead of `data` on Clover error values."
    }
  },
  create(context) {
    return {
      ObjectExpression(node: Rule.Node) {
        if (!isObjectExpressionNode(node)) {
          return;
        }

        if (!hasObjectProperty(node, "__code__") || !hasObjectProperty(node, "data")) {
          return;
        }

        const dataProperty = node.properties.find(
          (property: PropertyNode | { type: "SpreadElement" }) =>
            property.type === "Property" &&
            !property.computed &&
            getPropertyName(property.key) === "data"
        );

        if (dataProperty?.type === "Property") {
          reportLegacyData(context, dataProperty.key as Rule.Node);
        }
      },
      TSTypeLiteral(node: Rule.Node) {
        if (!isTypeBodyNode(node)) {
          return;
        }

        if (!hasTypeProperty(node, "__code__") || !hasTypeProperty(node, "data")) {
          return;
        }

        const dataProperty = node.members.find(
          (member: TSPropertySignatureNode) =>
            member.type === "TSPropertySignature" &&
            !member.computed &&
            getPropertyName(member.key) === "data"
        );

        if (dataProperty?.type === "TSPropertySignature") {
          reportLegacyData(context, dataProperty.key as Rule.Node);
        }
      },
      TSInterfaceBody(node: Rule.Node) {
        if (!isTypeBodyNode(node)) {
          return;
        }

        if (!hasTypeProperty(node, "__code__") || !hasTypeProperty(node, "data")) {
          return;
        }

        const dataProperty = node.members.find(
          (member: TSPropertySignatureNode) =>
            member.type === "TSPropertySignature" &&
            !member.computed &&
            getPropertyName(member.key) === "data"
        );

        if (dataProperty?.type === "TSPropertySignature") {
          reportLegacyData(context, dataProperty.key as Rule.Node);
        }
      },
      MemberExpression(node: Rule.Node) {
        if (!isMemberExpressionNode(node)) {
          return;
        }

        if (
          node.computed ||
          typeof node.property !== "object" ||
          node.property === null ||
          !("type" in node.property) ||
          node.property.type !== "Identifier" ||
          !("name" in node.property) ||
          node.property.name !== "data"
        ) {
          return;
        }

        if (looksLikeErrorReference(node.object)) {
          reportLegacyData(context, node.property as Rule.Node);
        }
      }
    };
  }
};
