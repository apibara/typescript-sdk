import { AsyncLocalStorage } from "node:async_hooks";
import type { Cursor, DataFinality } from "@apibara/protocol";
import { getContext } from "unctx";

// biome-ignore lint/suspicious/noExplicitAny: context type
export interface IndexerContext extends Record<string, any> {}

export const indexerAsyncContext = getContext<IndexerContext>("indexer", {
  asyncContext: true,
  AsyncLocalStorage,
});

export function useIndexerContext() {
  return indexerAsyncContext.use() as IndexerContext;
}

export interface MessageMetadataContext extends IndexerContext {
  cursor?: Cursor;
  endCursor?: Cursor;
  finality?: DataFinality;
}

export function useMessageMetadataContext(): MessageMetadataContext {
  return useIndexerContext() as MessageMetadataContext;
}
