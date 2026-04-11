import { createError, isError, type CloverError, type ErrorPayload, type Result } from "@clover/protocol";

export const CollectAsyncLimitedErrorCode = {
  InvalidLimit: 1101,
  LimitExceeded: 1102
} as const;

type CollectAsyncLimitedErrorCodeValue =
  (typeof CollectAsyncLimitedErrorCode)[keyof typeof CollectAsyncLimitedErrorCode];

export type CollectAsyncLimitedErrorPayload = {
  reason: string;
  limit: number;
  count: number;
};

export type CollectAsyncLimitedError = CloverError<
  CollectAsyncLimitedErrorCodeValue,
  CollectAsyncLimitedErrorPayload
>;

export const BufferAsyncChunksErrorCode = {
  InvalidChunkSize: 1201
} as const;

type BufferAsyncChunksErrorCodeValue =
  (typeof BufferAsyncChunksErrorCode)[keyof typeof BufferAsyncChunksErrorCode];

export type BufferAsyncChunksErrorPayload = {
  reason: string;
  size: number;
};

export type BufferAsyncChunksError = CloverError<
  BufferAsyncChunksErrorCodeValue,
  BufferAsyncChunksErrorPayload
>;

export const SliceAsyncErrorCode = {
  InvalidCount: 1301
} as const;

type SliceAsyncErrorCodeValue = (typeof SliceAsyncErrorCode)[keyof typeof SliceAsyncErrorCode];

export type SliceAsyncErrorPayload = {
  reason: string;
  count: number;
};

export type SliceAsyncError = CloverError<SliceAsyncErrorCodeValue, SliceAsyncErrorPayload>;

export const SplitAsyncByDelimiterErrorCode = {
  InvalidDelimiter: 1401
} as const;

type SplitAsyncByDelimiterErrorCodeValue =
  (typeof SplitAsyncByDelimiterErrorCode)[keyof typeof SplitAsyncByDelimiterErrorCode];

export type SplitAsyncByDelimiterErrorPayload = {
  reason: string;
  delimiter: string;
};

export type SplitAsyncByDelimiterError = CloverError<
  SplitAsyncByDelimiterErrorCodeValue,
  SplitAsyncByDelimiterErrorPayload
>;

type AsyncIteratorEntry<T> = {
  iterator: AsyncIterator<T>;
  pending: Promise<{
    entry: AsyncIteratorEntry<T>;
    result: IteratorResult<T>;
  }>;
};

function createCollectAsyncLimitedError<ErrorCode extends CollectAsyncLimitedErrorCodeValue>(
  code: ErrorCode,
  limit: number,
  count: number,
  reason: string
): CloverError<ErrorCode, CollectAsyncLimitedErrorPayload> {
  return createError(code, {
    reason,
    limit,
    count
  });
}

function createBufferAsyncChunksError<ErrorCode extends BufferAsyncChunksErrorCodeValue>(
  code: ErrorCode,
  size: number,
  reason: string
): CloverError<ErrorCode, BufferAsyncChunksErrorPayload> {
  return createError(code, {
    reason,
    size
  });
}

function createSliceAsyncError<ErrorCode extends SliceAsyncErrorCodeValue>(
  code: ErrorCode,
  count: number,
  reason: string
): CloverError<ErrorCode, SliceAsyncErrorPayload> {
  return createError(code, {
    reason,
    count
  });
}

function createSplitAsyncByDelimiterError<
  ErrorCode extends SplitAsyncByDelimiterErrorCodeValue
>(
  code: ErrorCode,
  delimiter: string,
  reason: string
): CloverError<ErrorCode, SplitAsyncByDelimiterErrorPayload> {
  return createError(code, {
    reason,
    delimiter
  });
}

function isValidPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isValidNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function queueNext<T>(entry: AsyncIteratorEntry<T>): void {
  entry.pending = entry.iterator.next().then((result) => ({
    entry,
    result
  }));
}

async function closeAsyncIteratorEntries<T>(entries: readonly AsyncIteratorEntry<T>[]): Promise<void> {
  await Promise.all(
    entries.map(async (entry) => {
      if (typeof entry.iterator.return === "function") {
        await entry.iterator.return();
      }
    })
  );
}

export async function collectAsyncLimited<T>(
  source: AsyncIterable<T>,
  limit: number
): Promise<Result<readonly T[], CollectAsyncLimitedErrorCodeValue, CollectAsyncLimitedErrorPayload>> {
  if (!isValidPositiveInteger(limit)) {
    return createCollectAsyncLimitedError(
      CollectAsyncLimitedErrorCode.InvalidLimit,
      limit,
      0,
      "invalid-limit"
    );
  }

  const values: T[] = [];

  for await (const item of source) {
    values.push(item);

    if (values.length > limit) {
      return createCollectAsyncLimitedError(
        CollectAsyncLimitedErrorCode.LimitExceeded,
        limit,
        values.length,
        "limit-exceeded"
      );
    }
  }

  return values;
}

export function bufferAsyncChunks<T>(
  source: AsyncIterable<T>,
  size: number
): Result<
  AsyncIterable<readonly T[]>,
  BufferAsyncChunksErrorCodeValue,
  BufferAsyncChunksErrorPayload
> {
  if (!isValidPositiveInteger(size)) {
    return createBufferAsyncChunksError(
      BufferAsyncChunksErrorCode.InvalidChunkSize,
      size,
      "invalid-chunk-size"
    );
  }

  async function* iterateChunks(): AsyncGenerator<readonly T[]> {
    let chunk: T[] = [];

    for await (const item of source) {
      chunk.push(item);

      if (chunk.length === size) {
        yield chunk;
        chunk = [];
      }
    }

    if (chunk.length > 0) {
      yield chunk;
    }
  }

  return {
    [Symbol.asyncIterator]() {
      return iterateChunks();
    }
  };
}

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

export function splitAsyncByDelimiter(
  source: AsyncIterable<string>,
  delimiter: string
): Result<
  AsyncIterable<string>,
  SplitAsyncByDelimiterErrorCodeValue,
  SplitAsyncByDelimiterErrorPayload
> {
  if (delimiter.length === 0) {
    return createSplitAsyncByDelimiterError(
      SplitAsyncByDelimiterErrorCode.InvalidDelimiter,
      delimiter,
      "invalid-delimiter"
    );
  }

  async function* iterateSegments(): AsyncGenerator<string> {
    let buffer = "";
    let sawChunk = false;

    for await (const chunk of source) {
      sawChunk = true;
      buffer += chunk;

      let index = buffer.indexOf(delimiter);
      while (index !== -1) {
        yield buffer.slice(0, index);
        buffer = buffer.slice(index + delimiter.length);
        index = buffer.indexOf(delimiter);
      }
    }

    if (!sawChunk) {
      yield "";
      return;
    }

    yield buffer;
  }

  return {
    [Symbol.asyncIterator]() {
      return iterateSegments();
    }
  };
}

export function concatAsync<T>(...sources: readonly AsyncIterable<T>[]): AsyncIterable<T> {
  async function* iterateConcatenated(): AsyncGenerator<T> {
    for (const source of sources) {
      for await (const item of source) {
        yield item;
      }
    }
  }

  return {
    [Symbol.asyncIterator]() {
      return iterateConcatenated();
    }
  };
}

export function mergeAsync<T>(...sources: readonly AsyncIterable<T>[]): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      const entries: AsyncIteratorEntry<T>[] = sources.map((source) => {
        const entry = {
          iterator: source[Symbol.asyncIterator](),
          pending: Promise.resolve(undefined as never)
        };

        queueNext(entry);
        return entry;
      });

      let closed = false;

      const iterator: AsyncIterator<T> = {
        next: async () => {
          while (!closed && entries.length > 0) {
            const { entry, result } = await Promise.race(entries.map((candidate) => candidate.pending));
            const index = entries.indexOf(entry);

            if (index === -1) {
              continue;
            }

            if (result.done) {
              entries.splice(index, 1);
              continue;
            }

            queueNext(entry);
            return {
              done: false,
              value: result.value
            };
          }

          closed = true;

          return {
            done: true,
            value: undefined
          };
        },
        return: async () => {
          closed = true;
          await closeAsyncIteratorEntries(entries);
          entries.length = 0;

          return {
            done: true,
            value: undefined
          };
        }
      };

      return iterator;
    }
  };
}

export function mapAsyncResult<
  T,
  U,
  InputCode extends number,
  InputPayload extends ErrorPayload,
  OutputCode extends number,
  OutputPayload extends ErrorPayload
>(
  source: AsyncIterable<Result<T, InputCode, InputPayload>>,
  map: (value: T, index: number) => Result<U, OutputCode, OutputPayload> | Promise<Result<U, OutputCode, OutputPayload>>
): AsyncIterable<Result<U, InputCode | OutputCode, InputPayload | OutputPayload>> {
  async function* iterateMapped(): AsyncGenerator<
    Result<U, InputCode | OutputCode, InputPayload | OutputPayload>
  > {
    let index = 0;

    for await (const item of source) {
      if (isError(item)) {
        yield item;
        index += 1;
        continue;
      }

      yield await map(item, index);
      index += 1;
    }
  }

  return {
    [Symbol.asyncIterator]() {
      return iterateMapped();
    }
  };
}
