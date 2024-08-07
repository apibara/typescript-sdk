import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import type { Client, Cursor } from "@apibara/protocol";
import { MockClient } from "@apibara/protocol/testing";
import { type Indexer, run } from "../indexer";
import type { SinkData } from "../sink";
import { vcr } from "../testing/vcr";
import { type CassetteDataType, deserialize } from "../vcr";
import type { VcrConfig } from "./config";

export async function replay<TFilter, TBlock, TRet>(
  vcrConfig: VcrConfig,
  indexer: Indexer<TFilter, TBlock, TRet>,
  cassetteName: string,
): Promise<VcrReplayResult> {
  const client = loadCassette<TFilter, TBlock>(vcrConfig, cassetteName);

  const sink = vcr();

  await run(client, indexer, sink);

  return {
    outputs: sink.result,
  };
}

export type VcrReplayResult = {
  outputs: Array<{ endCursor?: Cursor; data: SinkData[] }>;
};

export function loadCassette<TFilter, TBlock>(
  vcrConfig: VcrConfig,
  cassetteName: string,
): Client<TFilter, TBlock> {
  const filePath = path.join(vcrConfig.cassetteDir, `${cassetteName}.json`);

  const data = fs.readFileSync(filePath, "utf8");
  const cassetteData: CassetteDataType<TFilter, TBlock> = deserialize(data);

  const { filter, messages } = cassetteData;

  return new MockClient<TFilter, TBlock>((request, options) => {
    assert.deepStrictEqual(
      request.filter,
      filter,
      "Request and Cassette filter mismatch",
    );
    return messages;
  });
}
