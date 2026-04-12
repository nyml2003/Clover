import { describe, expect, it } from "vitest";
import { z } from "zod";

import { None, isError, isNone } from "@clover.js/protocol";
import {
  ZodErrorCode,
  fromSafeParse,
  parseNullableWith,
  parseOptionalNullableWith,
  parseOptionalWith,
  parseWith,
  unwrapParsedOption
} from "@clover.js/zod";

describe("@clover.js/zod", () => {
  const HostSchema = z.object({
    host: z.string(),
    port: z.number().int()
  });

  it("parses valid input through parseWith", () => {
    expect(parseWith(HostSchema, { host: "localhost", port: 8080 })).toEqual({
      host: "localhost",
      port: 8080
    });
  });

  it("converts parse failures into stable Clover errors", () => {
    const result = parseWith(HostSchema, { host: "localhost", port: "8080" });

    expect(isError(result)).toBe(true);
    if (!isError(result)) {
      return;
    }

    expect(result.__code__).toBe(ZodErrorCode.ParseFailed);
    expect(result.payload.mode).toBe("parse");
    expect(result.payload.inputKind).toBe("object");
    expect(result.payload.issueCount).toBe(1);
    expect(result.payload.firstPath).toBe("port");
    expect(typeof result.payload.firstMessage).toBe("string");
  });

  it("turns undefined into None for optional parsing", () => {
    const result = parseOptionalWith(z.string(), undefined);
    expect(isNone(result)).toBe(true);
    expect(result).toBe(None);
  });

  it("returns an error when optional parsing receives an invalid present value", () => {
    const result = parseOptionalWith(z.string(), 42);
    expect(isError(result)).toBe(true);
    if (!isError(result)) {
      return;
    }

    expect(result.__code__).toBe(ZodErrorCode.OptionalParseFailed);
    expect(result.payload.mode).toBe("optional");
    expect(result.payload.inputKind).toBe("number");
  });

  it("turns null into None for nullable parsing", () => {
    const result = parseNullableWith(z.string(), null);
    expect(isNone(result)).toBe(true);
    expect(result).toBe(None);
  });

  it("returns an error when nullable parsing receives an invalid present value", () => {
    const result = parseNullableWith(z.string(), false);
    expect(isError(result)).toBe(true);
    if (!isError(result)) {
      return;
    }

    expect(result.__code__).toBe(ZodErrorCode.NullableParseFailed);
    expect(result.payload.mode).toBe("nullable");
    expect(result.payload.inputKind).toBe("boolean");
  });

  it("turns null and undefined into None for optional-nullable parsing", () => {
    expect(parseOptionalNullableWith(z.number(), undefined)).toBe(None);
    expect(parseOptionalNullableWith(z.number(), null)).toBe(None);
  });

  it("returns an error when optional-nullable parsing receives an invalid present value", () => {
    const result = parseOptionalNullableWith(z.number().int(), []);
    expect(isError(result)).toBe(true);
    if (!isError(result)) {
      return;
    }

    expect(result.__code__).toBe(ZodErrorCode.OptionalNullableParseFailed);
    expect(result.payload.mode).toBe("optional-nullable");
    expect(result.payload.inputKind).toBe("array");
  });

  it("converts safeParse results directly", () => {
    const parsed = HostSchema.safeParse({ host: "localhost", port: 80 });
    expect(
      fromSafeParse(parsed, ZodErrorCode.ParseFailed, "parse", { host: "localhost", port: 80 })
    ).toEqual({
      host: "localhost",
      port: 80
    });

    const failed = HostSchema.safeParse({ host: "localhost", port: "80" });
    const result = fromSafeParse(failed, ZodErrorCode.ParseFailed, "parse", {
      host: "localhost",
      port: "80"
    });
    expect(isError(result)).toBe(true);
  });

  it("provides a small unwrap helper for option-shaped parse results", () => {
    const okResult = unwrapParsedOption(parseOptionalWith(z.string(), undefined));
    expect(okResult).toEqual({
      ok: true,
      value: None
    });

    const badResult = unwrapParsedOption(parseOptionalWith(z.string(), 42));
    expect(badResult.ok).toBe(false);
    if (badResult.ok) {
      return;
    }

    expect(badResult.error.__code__).toBe(ZodErrorCode.OptionalParseFailed);
  });
});
