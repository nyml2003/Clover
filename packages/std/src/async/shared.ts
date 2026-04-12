import { createError, type CloverError, type ErrorPayload, type Result } from "@clover.js/protocol";

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

export type SliceAsyncErrorCodeValue =
  (typeof SliceAsyncErrorCode)[keyof typeof SliceAsyncErrorCode];

export type SliceAsyncErrorPayload = {
  reason: string;
  count: number;
};

export type SliceAsyncError = CloverError<SliceAsyncErrorCodeValue, SliceAsyncErrorPayload>;

export const SplitAsyncByDelimiterErrorCode = {
  InvalidDelimiter: 1401
} as const;

export type SplitAsyncByDelimiterErrorCodeValue =
  (typeof SplitAsyncByDelimiterErrorCode)[keyof typeof SplitAsyncByDelimiterErrorCode];

export type SplitAsyncByDelimiterErrorPayload = {
  reason: string;
  delimiter: string;
};

export type SplitAsyncByDelimiterError = CloverError<
  SplitAsyncByDelimiterErrorCodeValue,
  SplitAsyncByDelimiterErrorPayload
>;

export type AsyncIteratorEntry<T> = {
  iterator: AsyncIterator<T>;
  pending: Promise<{
    entry: AsyncIteratorEntry<T>;
    result: IteratorResult<T>;
  }>;
};

export function createCollectAsyncLimitedError<ErrorCode extends CollectAsyncLimitedErrorCodeValue>(
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

export function createBufferAsyncChunksError<ErrorCode extends BufferAsyncChunksErrorCodeValue>(
  code: ErrorCode,
  size: number,
  reason: string
): CloverError<ErrorCode, BufferAsyncChunksErrorPayload> {
  return createError(code, {
    reason,
    size
  });
}

export function createSliceAsyncError<ErrorCode extends SliceAsyncErrorCodeValue>(
  code: ErrorCode,
  count: number,
  reason: string
): CloverError<ErrorCode, SliceAsyncErrorPayload> {
  return createError(code, {
    reason,
    count
  });
}

export function createSplitAsyncByDelimiterError<
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

export function isValidPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function isValidNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function queueNext<T>(entry: AsyncIteratorEntry<T>): void {
  entry.pending = entry.iterator.next().then((result) => ({
    entry,
    result
  }));
}

export async function closeAsyncIteratorEntries<T>(
  entries: readonly AsyncIteratorEntry<T>[]
): Promise<void> {
  const closes: Array<Promise<IteratorResult<T> | undefined>> = [];

  for (const entry of entries) {
    if (typeof entry.iterator.return === "function") {
      closes.push(entry.iterator.return());
    }
  }

  await Promise.all(closes);
}

export type MapAsyncResultInput<
  T,
  InputCode extends number,
  InputPayload extends ErrorPayload
> = AsyncIterable<Result<T, InputCode, InputPayload>>;
