import { test as viTest } from "vitest";
import type { Indexer } from "../indexer";
import {
  type CassetteOptions,
  type VcrConfig,
  type VcrReplayResult,
  isCassetteAvailable,
  loadCassette,
  record,
  replay,
} from "../vcr";

export const test = viTest.extend({
  vcr: {
    withClient,
  },
});

type WithClientContext<TFilter, TBlock, TTxnParams> = {
  run: (
    indexerArgs: Indexer<TFilter, TBlock, TTxnParams>,
  ) => Promise<VcrReplayResult>;
};

async function withClient<TFilter, TBlock, TTxnParams>(
  cassetteName: string,
  range: { fromBlock: bigint; toBlock: bigint },
  callback: (
    context: WithClientContext<TFilter, TBlock, TTxnParams>,
  ) => Promise<void>,
) {
  const vcrConfig: VcrConfig = {
    cassetteDir: "cassettes",
  };

  const cassetteOptions: CassetteOptions = {
    name: cassetteName,
    startingCursor: {
      orderKey: range.fromBlock,
    },
    endingCursor: {
      orderKey: range.toBlock,
    },
  };

  const context: WithClientContext<TFilter, TBlock, TTxnParams> = {
    async run(indexer) {
      const client = loadCassette<TFilter, TBlock>(vcrConfig, cassetteName);

      if (!isCassetteAvailable(vcrConfig, cassetteName)) {
        await record(vcrConfig, client, indexer, cassetteOptions);
      }

      return await replay(vcrConfig, indexer, cassetteName);
    },
  };

  await callback(context);
}
