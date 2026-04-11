import type { Rule } from "eslint";

export const noOptionalProperties: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow optional properties in Clover runtime and example shapes."
    },
    schema: [],
    messages: {
      optionalProperty: "Clover shapes should use explicit fields instead of optional properties."
    }
  },
  create(context) {
    return {
      "TSPropertySignature[optional=true]"(node: Rule.Node) {
        context.report({
          node,
          messageId: "optionalProperty"
        });
      },
      "PropertyDefinition[optional=true]"(node: Rule.Node) {
        context.report({
          node,
          messageId: "optionalProperty"
        });
      }
    };
  }
};
