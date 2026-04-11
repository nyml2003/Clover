import type { AsyncIteratorEntry } from "./shared.js";
import { closeAsyncIteratorEntries, queueNext } from "./shared.js";

export function mergeAsync<T>(...sources: readonly AsyncIterable<T>[]): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      const entries: AsyncIteratorEntry<T>[] = [];

      for (const source of sources) {
        const entry = {
          iterator: source[Symbol.asyncIterator](),
          pending: Promise.resolve(undefined as never)
        };

        queueNext(entry);
        entries.push(entry);
      }

      let closed = false;

      const iterator: AsyncIterator<T> = {
        next: async () => {
          while (!closed && entries.length > 0) {
            const pendingEntries: Array<Promise<{ entry: AsyncIteratorEntry<T>; result: IteratorResult<T> }>> = [];

            for (const candidate of entries) {
              pendingEntries.push(candidate.pending);
            }

            const { entry, result } = await Promise.race(pendingEntries);
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
