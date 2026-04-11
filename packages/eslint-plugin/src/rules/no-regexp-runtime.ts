import type { Rule } from "eslint";

export const noRegexpRuntime: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow RegExp usage in core runtime parsing code."
    },
    schema: [],
    messages: {
      noRegex: "Avoid RegExp in core runtime code. Prefer explicit scanning logic."
    }
  },
  create(context) {
    return {
      Literal(node) {
        if ("regex" in node && node.regex) {
          context.report({
            node,
            messageId: "noRegex"
          });
        }
      },
      NewExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "RegExp") {
          context.report({
            node,
            messageId: "noRegex"
          });
        }
      }
    };
  }
};
