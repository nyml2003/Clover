import { Linter } from "eslint";
import { describe, expect, it } from "vitest";
import parser from "@typescript-eslint/parser";

import plugin from "../src/index.js";

function runRule(ruleName: string, code: string, filePath: string = "test.ts") {
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
        [`clover/${ruleName}`]: "error"
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
});
