import { describe, expect, it } from "vitest";
import { z } from "zod";

import * as protocol from "@clover.js/protocol";
import * as std from "@clover.js/std";
import * as zodBoundary from "@clover.js/zod";
import * as cli from "@clover.js/cli";
import eslintPlugin from "@clover.js/eslint-plugin";
import eslintConfig from "@clover.js/eslint-config";
import tsconfigBase from "@clover.js/tsconfig/base.json";

const SystemTestErrorCode = {
  Synthetic: 9001
} as const;

describe("system integration", () => {
  it("verifies runtime, tooling, and config entry points after build", () => {
    expect(typeof protocol.None).toBe("symbol");
    expect(protocol.isNone(protocol.None)).toBe(true);
    expect(typeof protocol.createError(SystemTestErrorCode.Synthetic, "bad").__code__).toBe("number");

    const normalizedUrl = std.normalizeUrl("https://Example.COM:443/docs?q=1");
    expect(protocol.isError(normalizedUrl)).toBe(false);
    if (protocol.isError(normalizedUrl)) {
      return;
    }

    expect(normalizedUrl.host).toBe("example.com");
    expect(normalizedUrl.port).toBe(protocol.None);
    expect(normalizedUrl.query).toBe("q=1");
    expect(std.explainInvalidUrl("https://example.com/docs")).toBe(protocol.None);

    const numberResult = std.parseSmiInt("8080");
    expect(protocol.isError(numberResult)).toBe(false);

    const parsedTuple = zodBoundary.parseWith(
      z.tuple([z.literal("--port"), z.string()]),
      ["--port", "8080"]
    );
    expect(protocol.isError(parsedTuple)).toBe(false);

    const rendered = cli.renderCliResult({
      argv: ["node", "cli.js", "8080"],
      execute(args) {
        return args[0];
      },
      onSuccess(value) {
        return `value=${value}`;
      }
    });

    expect(rendered).toEqual({
      exitCode: 0,
      stdout: "value=8080"
    });

    expect(typeof eslintPlugin.meta?.name).toBe("string");
    expect(typeof eslintPlugin.rules["no-class-this"]).toBe("object");
    expect(Array.isArray(eslintConfig)).toBe(true);
    expect(eslintConfig.length).toBeGreaterThan(0);

    expect(tsconfigBase.compilerOptions.strict).toBe(true);
    expect(tsconfigBase.compilerOptions.exactOptionalPropertyTypes).toBe(true);
  });
});
