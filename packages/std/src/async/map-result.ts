import { isError, type ErrorPayload, type Result } from "@clover.js/protocol";

import type { MapAsyncResultInput } from "./shared.js";

export function mapAsyncResult<
  T,
  U,
  InputCode extends number,
  InputPayload extends ErrorPayload,
  OutputCode extends number,
  OutputPayload extends ErrorPayload
>(
  source: MapAsyncResultInput<T, InputCode, InputPayload>,
  map: (
    value: T,
    index: number
  ) => Result<U, OutputCode, OutputPayload> | Promise<Result<U, OutputCode, OutputPayload>>
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
