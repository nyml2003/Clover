import { describe, expect, it } from "vitest";

import { createError, isError, None } from "@clover/protocol";
import {
  andThenResult,
  err,
  mapErr,
  mapResult,
  matchResult,
  ok,
  unwrapOr
} from "@clover/std";

describe("@clover/std result", () => {
  it("creates ok values and fixed-shape error objects", () => {
    expect(ok(42)).toBe(42);
    expect(err(9001, None)).toEqual({
      __code__: 9001,
      data: None
    });
  });

  it("maps success results and preserves errors", () => {
    expect(mapResult(2, (value) => value * 2)).toBe(4);
    const failure = createError(9001, { input: "bad", retryable: false });
    expect(mapResult(failure, (value) => value)).toEqual(failure);
  });

  it("maps errors and chains success values", () => {
    const failure = createError(9001, { input: "bad", retryable: false });
    expect(
      mapErr(failure, (error) =>
        err(9002, {
          input: error.data.input,
          retryable: true
        })
      )
    ).toEqual({
      __code__: 9002,
      data: { input: "bad", retryable: true }
    });
    expect(mapErr(2, () => err(9002, None))).toBe(2);
    expect(andThenResult(2, (value) => value * 3)).toBe(6);
    expect(andThenResult(failure, (value) => value)).toEqual(failure);
  });

  it("unwraps with fallback and matches both branches", () => {
    const failure = createError(9001, { input: "bad", retryable: false });
    expect(unwrapOr(2, 0)).toBe(2);
    expect(unwrapOr(failure, 0)).toBe(0);
    expect(
      matchResult(
        2,
        (value) => value * 2,
        () => 0
      )
    ).toBe(4);
    expect(
      matchResult(
        failure,
        (value) => value,
        (error) => error.__code__
      )
    ).toBe(9001);
    expect(isError(failure)).toBe(true);
  });
});
