import type { Rule } from "eslint";

const ALLOWED_WORKSPACE_IMPORTS: Record<string, readonly string[]> = {
  protocol: [],
  std: ["@clover.js/protocol"],
  zod: ["@clover.js/protocol", "@clover.js/std"],
  cli: ["@clover.js/protocol", "@clover.js/std", "@clover.js/zod"],
  "eslint-plugin": [],
  "eslint-config": ["@clover.js/eslint-plugin"],
  tsconfig: []
};

function getPackageName(filename: string): string | null {
  const normalized = filename.replace(/\\/g, "/");
  const match = normalized.match(/(?:^|\/)packages\/([^/]+)\//);
  return match ? (match[1] ?? null) : null;
}

export const enforceImportDirection: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce Clover workspace dependency direction."
    },
    schema: [],
    messages: {
      invalidImport:
        "{{from}} cannot import {{source}} here. Allowed internal imports: {{allowed}}."
    }
  },
  create(context) {
    const packageName = getPackageName(context.filename);
    if (!packageName) {
      return {};
    }

    const allowed = new Set(ALLOWED_WORKSPACE_IMPORTS[packageName] ?? []);
    allowed.add(`@clover.js/${packageName}`);

    return {
      ImportDeclaration(node) {
        if (typeof node.source.value !== "string") {
          return;
        }

        const source = node.source.value;
        if (!source.startsWith("@clover.js/")) {
          return;
        }

        if (allowed.has(source)) {
          return;
        }

        context.report({
          node: node.source,
          messageId: "invalidImport",
          data: {
            from: `@clover.js/${packageName}`,
            source,
            allowed: [...allowed].sort().join(", ") || "(none)"
          }
        });
      }
    };
  }
};
