import type { Result } from "@clover.js/protocol";

import {
  CollectAsyncLimitedErrorCode,
  type CollectAsyncLimitedErrorPayload,
  createCollectAsyncLimitedError,
  isValidPositiveInteger
} from "./shared.js";

export async function collectAsyncLimited<T>(
  source: AsyncIterable<T>,
  limit: number
): Promise<
  Result<
    readonly T[],
    (typeof CollectAsyncLimitedErrorCode)[keyof typeof CollectAsyncLimitedErrorCode],
    CollectAsyncLimitedErrorPayload
  >
> {
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
