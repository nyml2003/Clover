import type { Rule } from "eslint";

export const noCoreExceptions: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow throw and try/catch in Clover core runtime paths."
    },
    schema: [],
    messages: {
      noThrow: "Core Clover runtime code should not throw exceptions.",
      noTry: "Core Clover runtime code should not use try/catch."
    }
  },
  create(context) {
    return {
      ThrowStatement(node) {
        context.report({
          node,
          messageId: "noThrow"
        });
      },
      TryStatement(node) {
        context.report({
          node,
          messageId: "noTry"
        });
      }
    };
  }
};
