import { None, isError } from "@clover/protocol";
import { describe, expect, it } from "vitest";

import {
  toBooleanValue,
  toFiniteNumberValue,
  toNonEmptyStringValue,
  toRecordValue,
  toSafeIntegerValue,
  toStringValue
} from "@clover/std";

describe("@clover/std convert", () => {
  it("converts strings and rejects non-strings", () => {
    expect(toStringValue("ok")).toBe("ok");
    expect(isError(toStringValue(42))).toBe(true);
  });

  it("converts non-empty strings and rejects empty input", () => {
    expect(toNonEmptyStringValue("value")).toBe("value");

    const result = toNonEmptyStringValue("");
    expect(isError(result)).toBe(true);
    if (!isError(result)) {
      return;
    }

    expect(result.payload.reason).toBe("empty-string");
  });

  it("converts finite numbers from numbers and strings", () => {
    expect(toFiniteNumberValue(42)).toBe(42);
    expect(toFiniteNumberValue("42.5")).toBe(42.5);
    expect(isError(toFiniteNumberValue("bad"))).toBe(true);
  });

  it("converts safe integers and rejects floats", () => {
    expect(toSafeIntegerValue("42")).toBe(42);

    const result = toSafeIntegerValue("4.2");
    expect(isError(result)).toBe(true);
    if (!isError(result)) {
      return;
    }

    expect(result.payload.reason).toBe("not-safe-integer");
  });

  it("converts booleans from strict values only", () => {
    expect(toBooleanValue(true)).toBe(true);
    expect(toBooleanValue("false")).toBe(false);
    expect(isError(toBooleanValue("yes"))).toBe(true);
  });

  it("converts object records and rejects arrays", () => {
    expect(toRecordValue({ answer: 42 })).toEqual({ answer: 42 });
    expect(isError(toRecordValue([1, 2, 3]))).toBe(true);
  });
});
