import type { Rule } from "eslint";

export const noClassThis: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow class and this usage in Clover runtime code."
    },
    schema: [],
    messages: {
      noClass: "Clover runtime code should not use classes.",
      noThis: "Clover runtime code should not use this."
    }
  },
  create(context) {
    return {
      ClassDeclaration(node) {
        context.report({
          node,
          messageId: "noClass"
        });
      },
      ClassExpression(node) {
        context.report({
          node,
          messageId: "noClass"
        });
      },
      ThisExpression(node) {
        context.report({
          node,
          messageId: "noThis"
        });
      }
    };
  }
};
