import type { Rule } from "eslint";

export const noLooseEquality: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow == and != in Clover code."
    },
    schema: [],
    messages: {
      noLooseEquality: "Use strict equality operators in Clover code."
    }
  },
  create(context) {
    return {
      BinaryExpression(node) {
        if (node.operator !== "==" && node.operator !== "!=") {
          return;
        }

        context.report({
          node,
          messageId: "noLooseEquality"
        });
      }
    };
  }
};
