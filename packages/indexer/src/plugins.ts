import { useIndexerContext } from "./context";
import type { Indexer } from "./indexer";

export type IndexerPlugin<TFilter, TBlock, TRet> = (
  indexer: Indexer<TFilter, TBlock, TRet>,
) => void;

export function defineIndexerPlugin<TFilter, TBlock, TRet>(
  def: IndexerPlugin<TFilter, TBlock, TRet>,
) {
  return def;
}

export function kv<TFilter, TBlock, TRet>() {
  return defineIndexerPlugin<TFilter, TBlock, TRet>((indexer) => {
    indexer.hooks.hook("run:before", async () => {
      const ctx = useIndexerContext();
      ctx.kv = {};
    });

    indexer.hooks.hook("run:after", async () => {
      console.log("kv: ", useIndexerContext().kv);
    });
  });
}
