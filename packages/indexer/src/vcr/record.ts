import fs from "node:fs/promises";
import path from "node:path";
import { type Indexer, run } from "@apibara/indexer";
import type { Client, StreamDataResponse } from "@apibara/protocol";
import { klona } from "klona/full";
import type { CassetteOptions, VcrConfig } from "./config";
import { serialize } from "./helper";

export type CassetteDataType<TFilter, TBlock> = {
  filter: TFilter;
  messages: StreamDataResponse<TBlock>[];
};

export async function record<TFilter, TBlock, TRet>(
  vcrConfig: VcrConfig,
  client: Client<TFilter, TBlock>,
  indexerArg: Indexer<TFilter, TBlock, TRet>,
  cassetteOptions: CassetteOptions,
) {
  const indexer = klona(indexerArg);
  const messages: StreamDataResponse<TBlock>[] = [];

  indexer.hooks.addHooks({
    "connect:before"({ options, request }) {
      request.startingCursor = cassetteOptions.startingCursor;
      options.endingCursor = cassetteOptions.endingCursor;
    },
    message({ message }) {
      messages.push(message);
    },
    async "run:after"() {
      const output: CassetteDataType<TFilter, TBlock> = {
        filter: indexer.options.filter,
        messages: messages,
      };
      const filePath = path.join(
        vcrConfig.cassetteDir,
        `${cassetteOptions.name}.json`,
      );
      await fs.writeFile(filePath, serialize(output), { flag: "w" });
    },
  });

  await run(client, indexer);
}
