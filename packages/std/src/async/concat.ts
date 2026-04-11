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
