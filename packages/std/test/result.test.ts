import { describe, expect, it } from "vitest";

import { createError, isError } from "@clover.js/protocol";
import {
  andThenResult,
  err,
  mapErr,
  mapResult,
  matchResult,
  ok,
  unwrapOr
} from "@clover.js/std";

const ResultErrorCode = {
  Failed: 9001,
  Retried: 9002
} as const;

describe("@clover.js/std result", () => {
  it("creates ok values and fixed-shape error objects", () => {
    expect(ok(42)).toBe(42);
    expect(err(ResultErrorCode.Failed, "bad-input")).toEqual({
      __code__: ResultErrorCode.Failed,
      payload: "bad-input"
    });
  });

  it("maps success results and preserves errors", () => {
    expect(mapResult(2, (value) => value * 2)).toBe(4);
    const failure = createError(ResultErrorCode.Failed, { input: "bad", retryable: false });
    expect(mapResult(failure, (value) => value)).toEqual(failure);
  });

  it("maps errors and chains success values", () => {
    const failure = createError(ResultErrorCode.Failed, { input: "bad", retryable: false });
    expect(
      mapErr(failure, (error) =>
        err(ResultErrorCode.Retried, {
          input: error.payload.input,
          retryable: true
        })
      )
    ).toEqual({
      __code__: ResultErrorCode.Retried,
      payload: { input: "bad", retryable: true }
    });
    expect(mapErr(2, () => err(ResultErrorCode.Retried, "retry"))).toBe(2);
    expect(andThenResult(2, (value) => value * 3)).toBe(6);
    expect(andThenResult(failure, (value) => value)).toEqual(failure);
  });

  it("unwraps with fallback and matches both branches", () => {
    const failure = createError(ResultErrorCode.Failed, { input: "bad", retryable: false });
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
    ).toBe(ResultErrorCode.Failed);
    expect(isError(failure)).toBe(true);
  });
});
