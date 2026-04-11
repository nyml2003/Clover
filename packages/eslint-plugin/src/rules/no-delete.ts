import type { Rule } from "eslint";

export const noDelete: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow delete in Clover runtime code."
    },
    schema: [],
    messages: {
      noDelete: "Clover runtime code should not delete object properties."
    }
  },
  create(context) {
    return {
      UnaryExpression(node) {
        if (node.operator !== "delete") {
          return;
        }

        context.report({
          node,
          messageId: "noDelete"
        });
      }
    };
  }
};
