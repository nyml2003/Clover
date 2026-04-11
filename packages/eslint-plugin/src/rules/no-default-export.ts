import type { Rule } from "eslint";

export const noDefaultExport: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow default exports in Clover runtime packages."
    },
    schema: [],
    messages: {
      noDefault: "Use named exports instead of default exports in Clover runtime packages."
    }
  },
  create(context) {
    return {
      ExportDefaultDeclaration(node) {
        context.report({
          node,
          messageId: "noDefault"
        });
      }
    };
  }
};
