import { AsyncLocalStorage } from "node:async_hooks";
import { getContext } from "unctx";

// biome-ignore lint/suspicious/noExplicitAny: context type
export interface IndexerContext extends Record<string, any> {}

export const indexerAsyncContext = getContext<IndexerContext>("indexer", {
  asyncContext: true,
  AsyncLocalStorage,
});

export function useIndexerContext() {
  return indexerAsyncContext.use();
}
