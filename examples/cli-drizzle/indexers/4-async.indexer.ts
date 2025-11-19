import { StarknetStream } from "@apibara/starknet";
import { defineIndexer } from "apibara/indexer";
import { useLogger } from "apibara/plugins";
import type { ApibaraRuntimeConfig } from "apibara/types";
import { hash } from "starknet";

export default async function (runtimeConfig: ApibaraRuntimeConfig) {
  const {
    starknet: { startingBlock },
  } = runtimeConfig;

  // Simulating a API call that takes 500 ms
  await new Promise((resolve) => setTimeout(resolve, 500));

  return defineIndexer(StarknetStream)({
    streamUrl: "https://mainnet.starknet.a5a.ch",
    finality: "accepted",
    startingBlock: BigInt(startingBlock),
    filter: {
      events: [
        {
          address:
            "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8" as `0x${string}`,
          keys: [hash.getSelectorFromName("Transfer") as `0x${string}`],
        },
      ],
    },
    hooks: {
      "run:before": ({ abortSignal }) => {
        // const logger = useLogger();
        // logger.info("=== FILE WATCHER SET UP ===");
        // watch("./tmp/test", { signal: abortSignal,  }, (eventType, filename) => {
        //   logger.info("=== FILE CHANGED ===");
        //   reloadIndexer();
        // });
      },
    },
    async transform({ endCursor, finality }) {
      const logger = useLogger();

      logger.info(
        "Transforming block | orderKey: ",
        endCursor?.orderKey,
        " | finality: ",
        finality,
      );

      await new Promise((resolve) => setTimeout(resolve, 3000));
    },
  });
}
