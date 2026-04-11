import type { Result } from "@clover/protocol";

import {
  BufferAsyncChunksErrorCode,
  type BufferAsyncChunksErrorPayload,
  createBufferAsyncChunksError,
  isValidPositiveInteger
} from "./shared.js";

export function bufferAsyncChunks<T>(
  source: AsyncIterable<T>,
  size: number
): Result<
  AsyncIterable<readonly T[]>,
  (typeof BufferAsyncChunksErrorCode)[keyof typeof BufferAsyncChunksErrorCode],
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
