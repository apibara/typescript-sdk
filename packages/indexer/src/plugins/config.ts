import type { Indexer } from "../indexer";

export type IndexerPlugin<TFilter, TBlock> = (
  indexer: Indexer<TFilter, TBlock>,
) => void;

export function defineIndexerPlugin<TFilter, TBlock>(
  def: IndexerPlugin<TFilter, TBlock>,
) {
  return def;
}
