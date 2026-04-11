import { describe, expect, it } from "vitest";

import { None, isError } from "@clover/protocol";
import {
  NumberErrorCode,
  clamp,
  inRange,
  isFiniteNumberValue,
  parseFiniteFloat64,
  parseSmiInt
} from "@clover/std";

describe("@clover/std number", () => {
  it("parses smi integers within the conservative int32 range", () => {
    expect(parseSmiInt("0")).toBe(0);
    expect(parseSmiInt("-42")).toBe(-42);
    expect(parseSmiInt("2147483647")).toBe(2147483647);
    expect(parseSmiInt("-2147483648")).toBe(-2147483648);
  });

  it("returns stable error objects for invalid smi parsing", () => {
    expect(parseSmiInt("")).toEqual({
      __code__: NumberErrorCode.InvalidSmiInt,
      data: { input: "", reason: "empty" }
    });
    expect(parseSmiInt("+")).toEqual({
      __code__: NumberErrorCode.InvalidSmiInt,
      data: { input: "+", reason: "sign-only" }
    });
    expect(parseSmiInt("1.5")).toEqual({
      __code__: NumberErrorCode.InvalidSmiInt,
      data: { input: "1.5", reason: "non-digit" }
    });
    expect(parseSmiInt("2147483648")).toEqual({
      __code__: NumberErrorCode.InvalidSmiInt,
      data: { input: "2147483648", reason: "overflow" }
    });
    expect(parseSmiInt("abc")).toEqual({
      __code__: NumberErrorCode.InvalidSmiInt,
      data: { input: "abc", reason: "non-digit" }
    });
  });

  it("parses finite float64 values without trimming host whitespace", () => {
    expect(parseFiniteFloat64("3.14")).toBe(3.14);
    expect(parseFiniteFloat64(" 3.14")).toEqual({
      __code__: NumberErrorCode.InvalidFiniteFloat64,
      data: { input: " 3.14", reason: "invalid-format" }
    });
    expect(parseFiniteFloat64("Infinity")).toEqual({
      __code__: NumberErrorCode.InvalidFiniteFloat64,
      data: { input: "Infinity", reason: "non-finite" }
    });
    expect(parseFiniteFloat64("NaN")).toEqual({
      __code__: NumberErrorCode.InvalidFiniteFloat64,
      data: { input: "NaN", reason: "non-finite" }
    });
  });

  it("provides range and clamp helpers", () => {
    expect(inRange(5, 1, 10)).toBe(true);
    expect(inRange(0, 1, 10)).toBe(false);
    expect(inRange(5, 10, 1)).toBe(true);
    expect(clamp(15, 1, 10)).toBe(10);
    expect(clamp(-1, 1, 10)).toBe(1);
    expect(clamp(5, 10, 1)).toBe(5);
  });

  it("checks finite runtime numbers explicitly", () => {
    expect(isFiniteNumberValue(1)).toBe(true);
    expect(isFiniteNumberValue(Infinity)).toBe(false);
    expect(isFiniteNumberValue(NaN)).toBe(false);
    expect(isFiniteNumberValue("1")).toBe(false);
  });

  it("still composes with the shared error guard", () => {
    const invalid = parseSmiInt("xyz");
    expect(isError(invalid)).toBe(true);
    expect(isError(None)).toBe(false);
  });
});
