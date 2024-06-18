import type { Client, StreamDataResponse } from "@apibara/protocol";
import { run, type Indexer } from "@apibara/indexer";
import type { CassetteOptions, VcrConfig } from "./config";
import { klona } from "klona/full";
import path from "node:path";
import fs from "node:fs/promises";

export type CassetteDataType<TFilter, TBlock> = {
  filter: TFilter;
  messages: StreamDataResponse<TBlock>[];
};

export async function record<TFilter, TBlock, TRet>(
  vcr: VcrConfig,
  client: Client<TFilter, TBlock>,
  indexer: Indexer<TFilter, TBlock, TRet>,
  cassetteOptions: CassetteOptions,
) {
  const _indexer = klona(indexer);
  const messages: StreamDataResponse<TBlock>[] = [];

  _indexer.hooks.addHooks({
    "connect:before"({ options, request }) {
      request.startingCursor = cassetteOptions.startingCursor;
      options.endingCursor = cassetteOptions.endingCursor;
    },
    message({ message }) {
      messages.push(message);
    },
    async "run:after"() {
      const output: CassetteDataType<TFilter, TBlock> = {
        filter: _indexer.options.filter,
        messages: messages,
      };
      const filePath = path.join(
        vcr.cassetteDir,
        `${cassetteOptions.name}.json`,
      );
      await fs.writeFile(filePath, serialize(output), { flag: "w" });
    },
  });

  await run(client, _indexer);
}

function serialize(obj: Record<string, unknown>): string {
  return JSON.stringify(
    obj,
    (_, value) => (typeof value === "bigint" ? `${value.toString()}n` : value),
    "\t",
  );
}
