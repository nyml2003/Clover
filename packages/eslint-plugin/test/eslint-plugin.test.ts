import { Linter } from "eslint";
import { describe, expect, it } from "vitest";
import parser from "@typescript-eslint/parser";

import plugin from "../src/index.js";

function runRule(
  ruleName: string,
  code: string,
  filePath: string = "test.ts",
  ruleOptions?: unknown
) {
  const linter = new Linter({ configType: "flat" });

  return linter.verify(
    code,
    {
      files: [filePath],
      languageOptions: {
        parser,
        ecmaVersion: "latest",
        sourceType: "module"
      },
      plugins: {
        clover: plugin
      },
      rules: {
        [`clover/${ruleName}`]: ruleOptions === undefined ? "error" : ["error", ruleOptions]
      }
    },
    filePath
  );
}

describe("@clover/eslint-plugin", () => {
  it("rejects raw numeric createError codes", () => {
    expect(runRule("no-raw-create-error-code", "createError(1, 'bad');")).toHaveLength(1);
    expect(
      runRule("no-raw-create-error-code", "createError(ErrorCode.InvalidPort, 'bad');")
    ).toHaveLength(0);
  });

  it("rejects invalid inline payload shapes", () => {
    expect(
      runRule("no-invalid-create-error-payload", "createError(ErrorCode.InvalidPort, None);")
    ).toHaveLength(1);
    expect(
      runRule(
        "no-invalid-create-error-payload",
        "createError(ErrorCode.InvalidPort, { input, nested: { bad: true } });"
      )
    ).toHaveLength(1);
    expect(
      runRule(
        "no-invalid-create-error-payload",
        "createError(ErrorCode.InvalidPort, { input, reason: error.payload.reason });"
      )
    ).toHaveLength(0);
  });

  it("rejects legacy Clover error data usage", () => {
    expect(
      runRule(
        "no-error-data-property",
        "const error = { __code__: ErrorCode.InvalidPort, data: 'bad' };"
      )
    ).toHaveLength(1);
    expect(runRule("no-error-data-property", "return error.data;")).toHaveLength(1);
    expect(runRule("no-error-data-property", "return result.data;")).toHaveLength(0);
  });

  it("rejects optional properties in Clover shapes", () => {
    expect(
      runRule(
        "no-optional-properties",
        "type Shape = { answer?: number; };"
      )
    ).toHaveLength(1);
    expect(runRule("no-optional-properties", "type Shape = { answer: number; };")).toHaveLength(0);
  });

  it("rejects throw and try/catch in core runtime files", () => {
    expect(runRule("no-core-exceptions", "throw new Error('bad');")).toHaveLength(1);
    expect(runRule("no-core-exceptions", "try { work(); } catch (error) { recover(error); }")).toHaveLength(1);
    expect(runRule("no-core-exceptions", "return value;")).toHaveLength(0);
  });

  it("rejects delete in runtime code", () => {
    expect(runRule("no-delete", "delete value.answer;")).toHaveLength(1);
    expect(runRule("no-delete", "value.answer = 1;")).toHaveLength(0);
  });

  it("rejects class and this usage", () => {
    expect(runRule("no-class-this", "class Example {}")).toHaveLength(1);
    expect(runRule("no-class-this", "function read() { return this.answer; }")).toHaveLength(1);
    expect(runRule("no-class-this", "const answer = 42;")).toHaveLength(0);
  });

  it("rejects for...in loops", () => {
    expect(runRule("no-for-in", "for (const key in value) { console.log(key); }")).toHaveLength(1);
    expect(runRule("no-for-in", "for (const key of keys) { console.log(key); }")).toHaveLength(0);
  });

  it("rejects loose equality", () => {
    expect(runRule("no-loose-equality", "if (value == null) { return None; }")).toHaveLength(1);
    expect(runRule("no-loose-equality", "if (value === null) { return None; }")).toHaveLength(0);
  });

  it("rejects direct zod imports in core packages", () => {
    expect(runRule("no-core-zod-import", "import { z } from 'zod';")).toHaveLength(1);
    expect(runRule("no-core-zod-import", "import { parseWith } from '@clover/zod';")).toHaveLength(0);
  });

  it("rejects invalid workspace import direction", () => {
    expect(
      runRule(
        "enforce-import-direction",
        "import { parseWith } from '@clover/zod';",
        "packages/std/src/file.ts"
      )
    ).toHaveLength(1);
    expect(
      runRule(
        "enforce-import-direction",
        "import { isError } from '@clover/protocol';",
        "packages/std/src/file.ts"
      )
    ).toHaveLength(0);
  });

  it("rejects oversized files unless they export a single function", () => {
    const lines = Array.from({ length: 301 }, (_, index) => `const value${index} = ${index};`).join("\n");
    expect(
      runRule("max-file-lines", lines, "packages/std/src/too-long.ts", { max: 300 })
    ).toHaveLength(1);

    const singleFunction = `export function parseHuge(): number {\n${Array.from(
      { length: 310 },
      (_, index) => `  const value${index} = ${index};`
    ).join("\n")}\n  return 1;\n}`;
    expect(
      runRule("max-file-lines", singleFunction, "packages/std/src/one-function.ts", { max: 300 })
    ).toHaveLength(0);
  });

  it("rejects exported nullish protocol drift in core code", () => {
    expect(
      runRule(
        "no-nullish-core",
        "export type Shape = { value: string | null };",
        "packages/std/src/nullish.ts"
      )
    ).toHaveLength(1);
    expect(
      runRule(
        "no-nullish-core",
        "export function read(): string | undefined { return undefined; }",
        "packages/std/src/nullish.ts"
      )
    ).toHaveLength(2);
  });

  it("rejects callback-based array iteration in core runtime files", () => {
    expect(
      runRule(
        "no-array-callback-iteration",
        "const result = values.map((value) => value + 1);",
        "packages/std/src/runtime.ts"
      )
    ).toHaveLength(1);
    expect(
      runRule(
        "no-array-callback-iteration",
        "for (const value of values) { total += value; }",
        "packages/std/src/runtime.ts"
      )
    ).toHaveLength(0);
  });

  it("rejects RegExp in core runtime files", () => {
    expect(
      runRule(
        "no-regexp-runtime",
        "const matcher = /abc/;",
        "packages/std/src/runtime.ts"
      )
    ).toHaveLength(1);
    expect(
      runRule(
        "no-regexp-runtime",
        "const matcher = new RegExp('abc');",
        "packages/std/src/runtime.ts"
      )
    ).toHaveLength(1);
  });

  it("rejects default exports in runtime packages", () => {
    expect(
      runRule(
        "no-default-export",
        "export default function read() { return 1; }",
        "packages/std/src/runtime.ts"
      )
    ).toHaveLength(1);
    expect(
      runRule(
        "no-default-export",
        "export function read() { return 1; }",
        "packages/std/src/runtime.ts"
      )
    ).toHaveLength(0);
  });
});
