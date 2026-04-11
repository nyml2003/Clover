import type { Rule } from "eslint";

type NodeRecord = Record<string, unknown>;

function asNodeRecord(node: unknown): NodeRecord | null {
  return node && typeof node === "object" ? (node as NodeRecord) : null;
}

function containsNullishType(node: unknown, seen: WeakSet<object> = new WeakSet()): boolean {
  const record = asNodeRecord(node);
  if (!record) {
    return false;
  }

  if (seen.has(record)) {
    return false;
  }

  seen.add(record);

  const type = record["type"];
  if (type === "TSNullKeyword" || type === "TSUndefinedKeyword") {
    return true;
  }

  for (const [key, value] of Object.entries(record)) {
    if (key === "parent" || key === "body") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (containsNullishType(item, seen)) {
          return true;
        }
      }
      continue;
    }

    if (containsNullishType(value, seen)) {
      return true;
    }
  }

  return false;
}

function hasNullishTypeInExport(declaration: unknown): boolean {
  const record = asNodeRecord(declaration);
  if (!record || typeof record["type"] !== "string") {
    return false;
  }

  if (record["type"] === "FunctionDeclaration" || record["type"] === "TSDeclareFunction") {
    return containsNullishType(record["returnType"]) || containsNullishType(record["params"]);
  }

  if (record["type"] === "TSTypeAliasDeclaration") {
    return containsNullishType(record["typeAnnotation"]);
  }

  if (record["type"] === "TSInterfaceDeclaration") {
    return containsNullishType(record["body"]);
  }

  if (record["type"] === "VariableDeclaration" && Array.isArray(record["declarations"])) {
    for (const item of record["declarations"]) {
      const itemRecord = asNodeRecord(item);
      if (itemRecord && containsNullishType(itemRecord["id"])) {
        return true;
      }
    }
  }

  return false;
}

function isNullishReturnArgument(argument: Rule.Node | null | undefined): boolean {
  if (!argument) {
    return false;
  }

  if (argument.type === "Literal") {
    return argument.value === null;
  }

  return argument.type === "Identifier" && argument.name === "undefined";
}

export const noNullishCore: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow exported nullish protocol drift in core packages."
    },
    schema: [],
    messages: {
      nullishType: "Exported Clover runtime APIs should not expose null or undefined in their type surface.",
      nullishReturn:
        "Exported Clover runtime functions should not return null or undefined directly."
    }
  },
  create(context) {
    return {
      ExportNamedDeclaration(node) {
        if (!node.declaration) {
          return;
        }

        if (hasNullishTypeInExport(node.declaration)) {
          context.report({
            node: node.declaration,
            messageId: "nullishType"
          });
        }
      },
      "ExportNamedDeclaration > FunctionDeclaration ReturnStatement"(node: Rule.Node) {
        const record = asNodeRecord(node);
        if (!record) {
          return;
        }

        if (isNullishReturnArgument((record["argument"] as Rule.Node | null | undefined) ?? null)) {
          context.report({
            node,
            messageId: "nullishReturn"
          });
        }
      }
    };
  }
};
