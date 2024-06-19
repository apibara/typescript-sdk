import { type Indexer, run } from "@apibara/indexer";
import type { Cursor } from "@apibara/protocol";
import { vcr } from "../testing/vcr";
import { VcrClient } from "./client";
import type { VcrConfig } from "./config";

export async function replay<TFilter, TBlock, TRet>(
  vcrConfig: VcrConfig,
  indexer: Indexer<TFilter, TBlock, TRet>,
  cassetteName: string,
): Promise<VcrReplayResult<TRet>> {
  const client = new VcrClient(vcrConfig, cassetteName, indexer.streamConfig);

  const sink = vcr<TRet>();

  await run(client, indexer, sink);

  return {
    outputs: sink.result,
  };
}

export type VcrReplayResult<TRet> = {
  outputs: Array<{ endCursor?: Cursor; data: TRet[] }>;
};
