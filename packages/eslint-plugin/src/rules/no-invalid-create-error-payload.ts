import type { Rule } from "eslint";

import type { NodeLike, ObjectExpressionNode, PropertyNode } from "../utils.js";
import { isCallExpressionNode, isCreateErrorCallee, isNoneIdentifier, isObjectExpressionNode } from "../utils.js";

const INVALID_INLINE_PAYLOAD_TYPES = new Set([
  "ArrayExpression",
  "ArrowFunctionExpression",
  "FunctionExpression",
  "NewExpression"
]);

function isInvalidInlineValue(node: NodeLike): boolean {
  return INVALID_INLINE_PAYLOAD_TYPES.has(node.type) || isNoneIdentifier(node);
}

function validateObjectPayload(context: Rule.RuleContext, node: ObjectExpressionNode) {
  for (const property of node.properties) {
    if (property.type === "SpreadElement") {
      context.report({
        node: property as Rule.Node,
        messageId: "invalidPayload"
      });
      continue;
    }

    if (
      property.type !== "Property" ||
      property.kind !== "init" ||
      property.computed ||
      property.method
    ) {
      context.report({
        node: property as Rule.Node,
        messageId: "invalidPayload"
      });
      continue;
    }

    const normalizedProperty = property as PropertyNode;

    if (
      normalizedProperty.value.type === "ObjectExpression" ||
      isInvalidInlineValue(normalizedProperty.value)
    ) {
      context.report({
        node: normalizedProperty.value as Rule.Node,
        messageId: "invalidPayload"
      });
    }
  }
}

export const noInvalidCreateErrorPayload: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Restrict inline createError payloads to scalars or flat object literals."
    },
    schema: [],
    messages: {
      invalidPayload:
        "Clover error payloads must be scalars or flat object literals with scalar fields."
    }
  },
  create(context) {
    return {
      CallExpression(node: Rule.Node) {
        if (!isCallExpressionNode(node)) {
          return;
        }

        if (!isCreateErrorCallee(node.callee)) {
          return;
        }

        const [, payload] = node.arguments;
        if (!payload) {
          return;
        }

        if (isObjectExpressionNode(payload)) {
          validateObjectPayload(context, payload);
          return;
        }

        if (
          typeof payload === "object" &&
          payload !== null &&
          "type" in payload &&
          isInvalidInlineValue(payload as NodeLike)
        ) {
          context.report({
            node: payload as Rule.Node,
            messageId: "invalidPayload"
          });
        }
      }
    };
  }
};
