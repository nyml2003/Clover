import type { Rule } from "eslint";

export const noForIn: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow for...in loops in Clover runtime code."
    },
    schema: [],
    messages: {
      noForIn: "Use explicit key iteration instead of for...in in Clover runtime code."
    }
  },
  create(context) {
    return {
      ForInStatement(node) {
        context.report({
          node,
          messageId: "noForIn"
        });
      }
    };
  }
};
