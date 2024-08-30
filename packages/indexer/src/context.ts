import { AsyncLocalStorage } from "node:async_hooks";
import { getContext } from "unctx";
import type { Sink } from "./sink";

// biome-ignore lint/suspicious/noExplicitAny: context type
export interface IndexerContext<TTxnParams = any> extends Record<string, any> {
  sink?: Sink<TTxnParams>;
  sinkTransaction?: TTxnParams;
}

export const indexerAsyncContext = getContext<IndexerContext>("indexer", {
  asyncContext: true,
  AsyncLocalStorage,
});

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function useIndexerContext<TTxnParams = any>() {
  return indexerAsyncContext.use() as IndexerContext<TTxnParams>;
}
