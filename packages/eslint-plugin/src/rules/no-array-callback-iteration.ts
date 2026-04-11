import type { Rule } from "eslint";

const DISALLOWED_METHODS = new Set(["map", "filter", "reduce", "flatMap", "forEach"]);

export const noArrayCallbackIteration: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer explicit iteration over callback-based array iteration in core runtime code."
    },
    schema: [],
    messages: {
      disallowed:
        "Avoid Array#{{method}} in core runtime code. Prefer explicit loops for predictable hot-path behavior."
    }
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "MemberExpression" || node.callee.computed) {
          return;
        }

        if (node.callee.property.type !== "Identifier") {
          return;
        }

        const method = node.callee.property.name;
        if (!DISALLOWED_METHODS.has(method)) {
          return;
        }

        context.report({
          node: node.callee.property,
          messageId: "disallowed",
          data: {
            method
          }
        });
      }
    };
  }
};
