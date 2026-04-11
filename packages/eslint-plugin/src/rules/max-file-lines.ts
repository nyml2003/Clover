import type { Rule } from "eslint";

const DEFAULT_MAX_LINES = 300;

function isFunctionLike(node: unknown): boolean {
  if (!node || typeof node !== "object" || !("type" in node)) {
    return false;
  }

  return (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  );
}

function allowsSingleExportedFunction(program: { body?: unknown }): boolean {
  if (!program.body || !Array.isArray(program.body)) {
    return false;
  }

  let exportCount = 0;
  let exportedFunctionCount = 0;

  for (const statement of program.body) {
    if (!statement || typeof statement !== "object" || !("type" in statement)) {
      continue;
    }

    if (statement.type === "ExportDefaultDeclaration") {
      exportCount += 1;
      exportedFunctionCount += isFunctionLike(statement.declaration) ? 1 : 0;
      continue;
    }

    if (statement.type !== "ExportNamedDeclaration") {
      continue;
    }

    exportCount += 1;

    const declaration = statement.declaration as Rule.Node | null | undefined;
    if (declaration && declaration.type === "FunctionDeclaration") {
      exportedFunctionCount += 1;
      continue;
    }

      if (declaration && declaration.type === "VariableDeclaration") {
        for (const item of declaration.declarations) {
        if (isFunctionLike(item.init)) {
          exportedFunctionCount += 1;
        } else {
          return false;
        }
      }
      continue;
    }

    if (statement.specifiers && statement.specifiers.length > 0) {
      return false;
    }
  }

  return exportCount === 1 && exportedFunctionCount === 1;
}

function countRelevantLines(sourceCode: { lines: string[] }): number {
  let count = 0;

  for (const line of sourceCode.lines) {
    const trimmed = line.trim();

    if (
      trimmed.length === 0 ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("*/")
    ) {
      continue;
    }

    count += 1;
  }

  return count;
}

export const maxFileLines: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Keep source files below the configured line limit unless they export one function."
    },
    schema: [
      {
        type: "object",
        properties: {
          max: {
            type: "number",
            minimum: 1
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      tooLong:
        "This file has {{actual}} relevant lines, which exceeds the limit of {{max}}."
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const option = context.options[0] as { max?: number } | undefined;
    const max = option?.max ?? DEFAULT_MAX_LINES;

    return {
      Program(node) {
        if (allowsSingleExportedFunction(node)) {
          return;
        }

        const actual = countRelevantLines(sourceCode);
        if (actual <= max) {
          return;
        }

        context.report({
          node,
          messageId: "tooLong",
          data: {
            actual: String(actual),
            max: String(max)
          }
        });
      }
    };
  }
};
