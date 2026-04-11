import { createError, isError } from "@clover/protocol";
import { describe, expect, it } from "vitest";

import {
  BufferAsyncChunksErrorCode,
  CollectAsyncLimitedErrorCode,
  bufferAsyncChunks,
  concatAsync,
  collectAsyncLimited,
  mapAsyncResult,
  mergeAsync,
  skipAsync,
  splitAsyncByDelimiter,
  SplitAsyncByDelimiterErrorCode,
  SliceAsyncErrorCode,
  stopAsyncWhen,
  takeAsync
} from "@clover/std";

async function* fromValues<T>(values: readonly T[]): AsyncGenerator<T> {
  for (const value of values) {
    yield value;
  }
}

async function* fromDelayedValues<T>(
  entries: ReadonlyArray<readonly [delayMs: number, value: T]>
): AsyncGenerator<T> {
  for (const [delayMs, value] of entries) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    yield value;
  }
}

async function collectValues<T>(source: AsyncIterable<T>): Promise<T[]> {
  const values: T[] = [];

  for await (const item of source) {
    values.push(item);
  }

  return values;
}

async function collectChunks<T>(source: AsyncIterable<readonly T[]>): Promise<T[][]> {
  const chunks: T[][] = [];

  for await (const chunk of source) {
    chunks.push([...chunk]);
  }

  return chunks;
}

describe("@clover/std async", () => {
  it("collects async values within the configured limit", async () => {
    await expect(collectAsyncLimited(fromValues([1, 2, 3]), 3)).resolves.toEqual([1, 2, 3]);
  });

  it("rejects invalid collection limits", async () => {
    const result = await collectAsyncLimited(fromValues([1, 2, 3]), 0);
    expect(result).toEqual({
      __code__: CollectAsyncLimitedErrorCode.InvalidLimit,
      payload: {
        reason: "invalid-limit",
        limit: 0,
        count: 0
      }
    });
  });

  it("fails fast when the async source exceeds the limit", async () => {
    let observedCount = 0;
    let closed = false;

    async function* source(): AsyncGenerator<number> {
      try {
        for (const value of [1, 2, 3, 4]) {
          observedCount += 1;
          yield value;
        }
      } finally {
        closed = true;
      }
    }

    const result = await collectAsyncLimited(source(), 2);

    expect(result).toEqual({
      __code__: CollectAsyncLimitedErrorCode.LimitExceeded,
      payload: {
        reason: "limit-exceeded",
        limit: 2,
        count: 3
      }
    });
    expect(observedCount).toBe(3);
    expect(closed).toBe(true);
  });

  it("buffers async values into fixed-size chunks", async () => {
    const buffered = bufferAsyncChunks(fromValues([1, 2, 3, 4, 5]), 2);
    expect(isError(buffered)).toBe(false);
    if (isError(buffered)) {
      return;
    }

    await expect(collectChunks(buffered)).resolves.toEqual([
      [1, 2],
      [3, 4],
      [5]
    ]);
  });

  it("returns no chunks for an empty async source", async () => {
    const buffered = bufferAsyncChunks(fromValues([]), 2);
    expect(isError(buffered)).toBe(false);
    if (isError(buffered)) {
      return;
    }

    await expect(collectChunks(buffered)).resolves.toEqual([]);
  });

  it("rejects invalid chunk sizes", async () => {
    expect(bufferAsyncChunks(fromValues([1, 2, 3]), 0)).toEqual({
      __code__: BufferAsyncChunksErrorCode.InvalidChunkSize,
      payload: {
        reason: "invalid-chunk-size",
        size: 0
      }
    });
  });

  it("takes the requested number of async values", async () => {
    const taken = takeAsync(fromValues([1, 2, 3, 4]), 2);
    expect(isError(taken)).toBe(false);
    if (isError(taken)) {
      return;
    }

    await expect(collectAsyncLimited(taken, 2)).resolves.toEqual([1, 2]);
  });

  it("skips the requested number of async values", async () => {
    const skipped = skipAsync(fromValues([1, 2, 3, 4]), 2);
    expect(isError(skipped)).toBe(false);
    if (isError(skipped)) {
      return;
    }

    await expect(collectAsyncLimited(skipped, 2)).resolves.toEqual([3, 4]);
  });

  it("rejects invalid take and skip counts", () => {
    expect(takeAsync(fromValues([1, 2, 3]), -1)).toEqual({
      __code__: SliceAsyncErrorCode.InvalidCount,
      payload: {
        reason: "invalid-count",
        count: -1
      }
    });
    expect(skipAsync(fromValues([1, 2, 3]), -1)).toEqual({
      __code__: SliceAsyncErrorCode.InvalidCount,
      payload: {
        reason: "invalid-count",
        count: -1
      }
    });
  });

  it("stops async iteration before the matching item is yielded", async () => {
    let closed = false;

    async function* source(): AsyncGenerator<number> {
      try {
        for (const value of [1, 2, 3, 4]) {
          yield value;
        }
      } finally {
        closed = true;
      }
    }

    const stopped = stopAsyncWhen(source(), (value) => value === 3);
    await expect(collectAsyncLimited(stopped, 4)).resolves.toEqual([1, 2]);
    expect(closed).toBe(true);
  });

  it("concatenates async sources in source order", async () => {
    const concatenated = concatAsync(fromValues([1, 2]), fromValues([3]), fromValues([4, 5]));
    await expect(collectValues(concatenated)).resolves.toEqual([1, 2, 3, 4, 5]);
  });

  it("merges async sources by readiness", async () => {
    const merged = mergeAsync(
      fromDelayedValues([
        [0, "a1"],
        [20, "a2"]
      ]),
      fromDelayedValues([
        [10, "b1"],
        [25, "b2"]
      ])
    );

    await expect(collectValues(merged)).resolves.toEqual(["a1", "b1", "a2", "b2"]);
  });

  it("maps async result values and preserves async errors", async () => {
    const ResultErrorCode = {
      InputFailed: 9001,
      OutputFailed: 9002
    } as const;

    async function* source(): AsyncGenerator<
      number | ReturnType<typeof createError<typeof ResultErrorCode.InputFailed, "bad-input">>
    > {
      yield 2;
      yield createError(ResultErrorCode.InputFailed, "bad-input");
      yield 3;
    }

    const mapped = mapAsyncResult(source(), async (value) => {
      if (value === 3) {
        return createError(ResultErrorCode.OutputFailed, "bad-output");
      }

      return value * 10;
    });

    await expect(collectValues(mapped)).resolves.toEqual([
      20,
      createError(ResultErrorCode.InputFailed, "bad-input"),
      createError(ResultErrorCode.OutputFailed, "bad-output")
    ]);
  });

  it("splits async string chunks across delimiter boundaries", async () => {
    const split = splitAsyncByDelimiter(
      fromValues(["alpha\nbe", "ta\n", "gamma"]),
      "\n"
    );
    expect(isError(split)).toBe(false);
    if (isError(split)) {
      return;
    }

    await expect(collectValues(split)).resolves.toEqual(["alpha", "beta", "gamma"]);
  });

  it("preserves empty segments for consecutive and trailing delimiters", async () => {
    const split = splitAsyncByDelimiter(fromValues(["a||b||"]), "||");
    expect(isError(split)).toBe(false);
    if (isError(split)) {
      return;
    }

    await expect(collectValues(split)).resolves.toEqual(["a", "b", ""]);
  });

  it("returns a single empty segment for an empty async source", async () => {
    const split = splitAsyncByDelimiter(fromValues([]), "\n");
    expect(isError(split)).toBe(false);
    if (isError(split)) {
      return;
    }

    await expect(collectValues(split)).resolves.toEqual([""]);
  });

  it("rejects empty split delimiters", () => {
    expect(splitAsyncByDelimiter(fromValues(["alpha"]), "")).toEqual({
      __code__: SplitAsyncByDelimiterErrorCode.InvalidDelimiter,
      payload: {
        reason: "invalid-delimiter",
        delimiter: ""
      }
    });
  });
});
