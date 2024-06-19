import { test as viTest } from "vitest";
import type { Indexer } from "../indexer";
import {
  type CassetteOptions,
  VcrClient,
  type VcrConfig,
  type VcrReplayResult,
  record,
  replay,
} from "../vcr";

export function test() {
  return viTest.extend({
    vcr: {
      withClient,
    },
  });
}

type WithClientContext<TFilter, TBlock, TRet> = {
  run: (
    indexerArgs: Indexer<TFilter, TBlock, TRet>,
  ) => Promise<VcrReplayResult<TRet>>;
};

async function withClient<TFilter, TBlock, TRet>(
  cassetteName: string,
  range: { fromBlock: bigint; toBlock: bigint },
  callback: (
    context: WithClientContext<TFilter, TBlock, TRet>,
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

  const context: WithClientContext<TFilter, TBlock, TRet> = {
    async run(indexer) {
      const client = new VcrClient(
        vcrConfig,
        cassetteName,
        indexer.streamConfig,
      );

      if (!client.isCassetteAvailable()) {
        await record(vcrConfig, client, indexer, cassetteOptions);
      }

      return await replay(vcrConfig, indexer, cassetteName);
    },
  };

  await callback(context);
}
