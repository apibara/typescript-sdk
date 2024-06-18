import type { Indexer } from "@apibara/indexer";
import { VcrClient } from "./client";
import type { VcrConfig } from "./config";

export async function replay<TFilter, TBlock, TRet>(
  vcrConfig: VcrConfig,
  indexer: Indexer<TFilter, TBlock, TRet>,
  cassetteName: string,
) {
  return new VcrClient(vcrConfig, cassetteName, indexer.streamConfig);
}
