import { createAuthenticatedClient } from "@apibara/protocol";
import ci from "ci-info";
import { type NestedHooks, mergeHooks } from "hookable";
import { useIndexerContext } from "../context";
import {
  type IndexerHooks,
  type IndexerWithStreamConfig,
  createIndexer,
} from "../indexer";
import { type InternalContext, internalContext } from "../plugins/context";
import { logger } from "../plugins/logger";
import type { CassetteOptions, VcrConfig } from "../vcr/config";
import { isCassetteAvailable } from "../vcr/helper";
import { record } from "../vcr/record";
import { replay } from "../vcr/replay";

export type VcrResult = Record<string, unknown>;

export function createVcr() {
  let result: VcrResult;

  return {
    async run<TFilter, TBlock>(
      cassetteName: string,
      indexerConfig: IndexerWithStreamConfig<TFilter, TBlock>,
      config: {
        range: { fromBlock: bigint; toBlock: bigint };
        hooks?: NestedHooks<IndexerHooks<TFilter, TBlock>>;
      },
    ) {
      const vcrConfig: VcrConfig = {
        cassetteDir: "cassettes",
      };

      indexerConfig.hooks = mergeHooks(
        indexerConfig.hooks ?? {},
        config.hooks ?? {},
      );

      const cassetteOptions: CassetteOptions = {
        name: cassetteName,
        startingCursor: {
          orderKey: config.range.fromBlock,
        },
        endingCursor: {
          orderKey: config.range.toBlock,
        },
      };

      indexerConfig.plugins = [
        internalContext({
          indexerName: cassetteName,
          availableIndexers: [cassetteName],
        } as InternalContext),
        logger(),
        ...(indexerConfig.plugins ?? []),
      ];

      const indexer = createIndexer(indexerConfig);

      indexer.hooks.hook("run:after", () => {
        result = useIndexerContext();
      });

      if (!isCassetteAvailable(vcrConfig, cassetteName)) {
        if (ci.isCI) {
          throw new Error("Cannot record cassette in CI");
        }

        const client = createAuthenticatedClient(
          indexer.streamConfig,
          indexer.options.streamUrl,
        );
        await record(vcrConfig, client, indexer, cassetteOptions);
      } else {
        await replay(vcrConfig, indexer, cassetteName);
      }

      return result;
    },
  };
}
