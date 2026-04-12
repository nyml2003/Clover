import type { Result } from "@clover/protocol";

import {
  SplitAsyncByDelimiterErrorCode,
  type SplitAsyncByDelimiterErrorCodeValue,
  type SplitAsyncByDelimiterErrorPayload,
  createSplitAsyncByDelimiterError
} from "./shared.js";

export function splitAsyncByDelimiter(
  source: AsyncIterable<string>,
  delimiter: string
): Result<AsyncIterable<string>, SplitAsyncByDelimiterErrorCodeValue, SplitAsyncByDelimiterErrorPayload> {
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
