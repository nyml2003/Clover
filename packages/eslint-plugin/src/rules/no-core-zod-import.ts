import type { Rule } from "eslint";

export const noCoreZodImport: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow direct zod imports outside boundary packages."
    },
    schema: [],
    messages: {
      noZod: "Direct zod imports are only allowed in boundary packages such as @clover.js/zod."
    }
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value !== "zod") {
          return;
        }

        context.report({
          node: node.source,
          messageId: "noZod"
        });
      }
    };
  }
};
