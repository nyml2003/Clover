import { describe, expect, it } from "vitest";

import {
  None,
  assertNever,
  createError,
  isError,
  isErrorObjectPayload,
  isErrorPayload,
  isErrorScalarPayload,
  isNone
} from "@clover.js/protocol";

const ProtocolErrorCode = {
  MissingValue: 1001,
  InvalidInput: 1002
} as const;

describe("@clover.js/protocol", () => {
  it("keeps None as a symbol sentinel", () => {
    expect(typeof None).toBe("symbol");
  });

  it("narrows None with guards", () => {
    expect(isNone(None)).toBe(true);
    expect(isNone("value")).toBe(false);
  });

  it("creates fixed-shape error objects", () => {
    expect(createError(ProtocolErrorCode.MissingValue, "missing-value")).toEqual({
      __code__: ProtocolErrorCode.MissingValue,
      payload: "missing-value"
    });
    expect(createError(ProtocolErrorCode.InvalidInput, { input: "80", reason: "bad" })).toEqual({
      __code__: ProtocolErrorCode.InvalidInput,
      payload: { input: "80", reason: "bad" }
    });
  });

  it("checks scalar error payloads", () => {
    expect(isErrorScalarPayload("bad")).toBe(true);
    expect(isErrorScalarPayload(42)).toBe(true);
    expect(isErrorScalarPayload(false)).toBe(true);
    expect(isErrorScalarPayload(null)).toBe(false);
    expect(isErrorScalarPayload(undefined)).toBe(false);
    expect(isErrorScalarPayload(Symbol.for("bad"))).toBe(false);
    expect(isErrorScalarPayload(() => 1)).toBe(false);
  });

  it("checks object error payloads with scalar leaf values only", () => {
    expect(
      isErrorObjectPayload({
        input: "80",
        reason: "overflow",
        retryable: false
      })
    ).toBe(true);
    expect(isErrorObjectPayload({})).toBe(true);
    expect(isErrorObjectPayload({ nested: { bad: true } })).toBe(false);
    expect(isErrorObjectPayload(["bad"])).toBe(false);
    expect(isErrorObjectPayload(null)).toBe(false);
  });

  it("checks all allowed error payload variants", () => {
    expect(isErrorPayload("bad")).toBe(true);
    expect(isErrorPayload(42)).toBe(true);
    expect(isErrorPayload(true)).toBe(true);
    expect(isErrorPayload({ input: "80", reason: "bad" })).toBe(true);
    expect(isErrorPayload({ nested: { bad: true } })).toBe(false);
  });

  it("checks error objects through the reserved __code__ field", () => {
    expect(isError(createError(ProtocolErrorCode.MissingValue, "missing-value"))).toBe(true);
    expect(
      isError({
        __code__: ProtocolErrorCode.InvalidInput,
        payload: { input: "80", reason: "bad" }
      })
    ).toBe(true);
    expect(
      isError({
        __code__: ProtocolErrorCode.MissingValue,
        payload: { nested: { bad: true } }
      })
    ).toBe(false);
    expect(isError({ __code__: ProtocolErrorCode.MissingValue, payload: () => 1 })).toBe(false);
    expect(isError({ __code__: "1001", payload: "bad" })).toBe(false);
    expect(isError({ payload: "bad" })).toBe(false);
    expect(isError({ __code__: ProtocolErrorCode.MissingValue })).toBe(false);
    expect(isError(null)).toBe(false);
    expect(isError(["bad"])).toBe(false);
  });

  it("throws on forced assertNever", () => {
    expect(() => assertNever("bad" as never, "forced failure")).toThrow("forced failure");
  });
});
