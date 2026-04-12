import type { Result } from "@clover.js/protocol";

import {
  SliceAsyncErrorCode,
  type SliceAsyncErrorCodeValue,
  type SliceAsyncErrorPayload,
  createSliceAsyncError,
  isValidNonNegativeInteger
} from "./shared.js";

export function takeAsync<T>(
  source: AsyncIterable<T>,
  count: number
): Result<AsyncIterable<T>, SliceAsyncErrorCodeValue, SliceAsyncErrorPayload> {
  if (!isValidNonNegativeInteger(count)) {
    return createSliceAsyncError(SliceAsyncErrorCode.InvalidCount, count, "invalid-count");
  }

  async function* iterateTaken(): AsyncGenerator<T> {
    if (count === 0) {
      return;
    }

    let seen = 0;

    for await (const item of source) {
      yield item;
      seen += 1;

      if (seen >= count) {
        return;
      }
    }
  }

  return {
    [Symbol.asyncIterator]() {
      return iterateTaken();
    }
  };
}

export function skipAsync<T>(
  source: AsyncIterable<T>,
  count: number
): Result<AsyncIterable<T>, SliceAsyncErrorCodeValue, SliceAsyncErrorPayload> {
  if (!isValidNonNegativeInteger(count)) {
    return createSliceAsyncError(SliceAsyncErrorCode.InvalidCount, count, "invalid-count");
  }

  async function* iterateSkipped(): AsyncGenerator<T> {
    let seen = 0;

    for await (const item of source) {
      if (seen < count) {
        seen += 1;
        continue;
      }

      yield item;
    }
  }

  return {
    [Symbol.asyncIterator]() {
      return iterateSkipped();
    }
  };
}

export function stopAsyncWhen<T>(
  source: AsyncIterable<T>,
  shouldStop: (item: T, index: number) => boolean
): AsyncIterable<T> {
  async function* iterateUntilStop(): AsyncGenerator<T> {
    let index = 0;

    for await (const item of source) {
      if (shouldStop(item, index)) {
        return;
      }

      yield item;
      index += 1;
    }
  }

  return {
    [Symbol.asyncIterator]() {
      return iterateUntilStop();
    }
  };
}
