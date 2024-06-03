import type { NestedHooks } from "hookable";
import type { Cursor, DataFinality, StreamConfig } from "@apibara/protocol";

export interface IndexerHooks {
  "run:before": () => void;
  "run:after": () => void;
}

export interface IndexerConfig<TFilter, TBlock, TRet> {
  streamUrl: string;
  filter: TFilter;
  finality?: DataFinality;
  startingCursor?: Cursor;
  factory?: (block: TBlock) => { filter?: TFilter; data?: TRet };
  transform: (block: TBlock) => TRet;
  hooks?: NestedHooks<IndexerHooks>;
}

export interface IndexerWithStreamConfig<TFilter, TBlock, TRet>
  extends IndexerConfig<TFilter, TBlock, TRet> {
  streamConfig: StreamConfig<TFilter, TBlock>;
}

export function defineIndexer<TFilter, TBlock>(
  streamConfig: StreamConfig<TFilter, TBlock>,
) {
  return <TRet>(
    config: IndexerConfig<TFilter, TBlock, TRet>,
  ): IndexerWithStreamConfig<TFilter, TBlock, TRet> => ({
    streamConfig,
    ...config,
  });
}
