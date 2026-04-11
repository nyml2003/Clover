import type { Rule } from "eslint";

import { isCallExpressionNode, isCreateErrorCallee, isNumericLiteral } from "../utils.js";

export const noRawCreateErrorCode: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require createError codes to come from named enum members."
    },
    schema: [],
    messages: {
      rawCode: "Pass a named error-code enum member to createError(...) instead of a raw number."
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

        const [code] = node.arguments;
        if (isNumericLiteral(code)) {
          context.report({
            node: code as Rule.Node,
            messageId: "rawCode"
          });
        }
      }
    };
  }
};
