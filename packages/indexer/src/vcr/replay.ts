import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import type { Client } from "@apibara/protocol";
import { MockClient } from "@apibara/protocol/testing";
import { type Indexer, run } from "../indexer";
import { type CassetteDataType, deserialize } from "../vcr";
import type { VcrConfig } from "./config";

export async function replay<TFilter, TBlock, TTxnParams>(
  vcrConfig: VcrConfig,
  indexer: Indexer<TFilter, TBlock>,
  cassetteName: string,
) {
  const client = loadCassette<TFilter, TBlock>(vcrConfig, cassetteName);
  await run(client, indexer);
}

export function loadCassette<TFilter, TBlock>(
  vcrConfig: VcrConfig,
  cassetteName: string,
): Client<TFilter, TBlock> {
  const filePath = path.join(vcrConfig.cassetteDir, `${cassetteName}.json`);

  const data = fs.readFileSync(filePath, "utf8");
  const cassetteData: CassetteDataType<TFilter, TBlock> = deserialize(data);

  const { filter, messages } = cassetteData;

  return new MockClient<TFilter, TBlock>((request, options) => {
    // Notice that the request filter is an array of filters,
    // so we need to wrap the indexer filter in an array.
    assert.deepStrictEqual(
      request.filter,
      [filter],
      "Indexer and cassette filter mismatch. Hint: delete the cassette and run again.",
    );

    return messages;
  });
}
