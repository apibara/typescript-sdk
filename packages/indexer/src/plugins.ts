import type { Indexer } from "./indexer";

export type IndexerPlugin<TFilter, TBlock, TRet> = (
  indexer: Indexer<TFilter, TBlock, TRet>,
) => void;

export function defineIndexerPlugin<TFilter, TBlock, TRet>(
  def: IndexerPlugin<TFilter, TBlock, TRet>,
) {
  return def;
}
