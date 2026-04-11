import { describe, expect, it } from "vitest";

import {
  None,
  assertNever,
  createError,
  isError,
  isErrorData,
  isErrorObjectData,
  isErrorScalarData,
  isNone
} from "@clover/protocol";

describe("@clover/protocol", () => {
  it("keeps None as a symbol sentinel", () => {
    expect(typeof None).toBe("symbol");
  });

  it("narrows None with guards", () => {
    expect(isNone(None)).toBe(true);
    expect(isNone("value")).toBe(false);
  });

  it("creates fixed-shape error objects", () => {
    expect(createError(1001, None)).toEqual({
      __code__: 1001,
      data: None
    });
    expect(createError(1002, { input: "80", reason: "bad" })).toEqual({
      __code__: 1002,
      data: { input: "80", reason: "bad" }
    });
  });

  it("checks scalar error data", () => {
    expect(isErrorScalarData(None)).toBe(true);
    expect(isErrorScalarData("bad")).toBe(true);
    expect(isErrorScalarData(42)).toBe(true);
    expect(isErrorScalarData(false)).toBe(true);
    expect(isErrorScalarData(null)).toBe(false);
    expect(isErrorScalarData(undefined)).toBe(false);
    expect(isErrorScalarData(Symbol.for("bad"))).toBe(false);
    expect(isErrorScalarData(() => 1)).toBe(false);
  });

  it("checks object error data with scalar leaf values only", () => {
    expect(
      isErrorObjectData({
        input: "80",
        reason: "overflow",
        retryable: false
      })
    ).toBe(true);
    expect(isErrorObjectData({})).toBe(true);
    expect(isErrorObjectData({ nested: { bad: true } })).toBe(false);
    expect(isErrorObjectData(["bad"])).toBe(false);
    expect(isErrorObjectData(null)).toBe(false);
  });

  it("checks all allowed error data variants", () => {
    expect(isErrorData(None)).toBe(true);
    expect(isErrorData("bad")).toBe(true);
    expect(isErrorData(42)).toBe(true);
    expect(isErrorData(true)).toBe(true);
    expect(isErrorData({ input: "80", reason: None })).toBe(true);
    expect(isErrorData({ nested: { bad: true } })).toBe(false);
  });

  it("checks error objects through the reserved __code__ field", () => {
    expect(isError(createError(1001, None))).toBe(true);
    expect(isError({ __code__: 1001, data: { input: "80", reason: "bad" } })).toBe(true);
    expect(isError({ __code__: "1001", data: None })).toBe(false);
    expect(isError({ data: None })).toBe(false);
    expect(isError({ __code__: 1001 })).toBe(false);
    expect(isError(null)).toBe(false);
    expect(isError(["bad"])).toBe(false);
  });

  it("throws on forced assertNever", () => {
    expect(() => assertNever("bad" as never, "forced failure")).toThrow("forced failure");
  });
});
