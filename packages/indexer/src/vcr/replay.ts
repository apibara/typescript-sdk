import { VcrClient } from "./client";
import type { VcrConfig } from "./config";
import type { Indexer } from "@apibara/indexer";

export async function replay<TFilter, TBlock, TRet>(
  vcrConfig: VcrConfig,
  indexer: Indexer<TFilter, TBlock, TRet>,
  cassetteName: string,
) {
  return new VcrClient(vcrConfig, cassetteName, indexer.streamConfig);
}
