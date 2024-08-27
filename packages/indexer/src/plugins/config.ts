import type { Indexer } from "../indexer";

export type IndexerPlugin<TFilter, TBlock, TTxnParams> = (
  indexer: Indexer<TFilter, TBlock, TTxnParams>,
) => void;

export function defineIndexerPlugin<TFilter, TBlock, TTxnParams>(
  def: IndexerPlugin<TFilter, TBlock, TTxnParams>,
) {
  return def;
}
