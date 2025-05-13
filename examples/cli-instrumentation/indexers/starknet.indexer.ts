import { defineIndexer } from "@apibara/indexer";
import { useLogger } from "@apibara/indexer/plugins";
import { StarknetStream } from "@apibara/starknet";
import type { ApibaraRuntimeConfig } from "apibara/types";

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  return defineIndexer(StarknetStream)({
    streamUrl: "https://mainnet.starknet.a5a.ch",
    finality: "accepted",
    startingBlock: 10_30_000n,
    filter: {
      header: "always",
    },
    async transform({ endCursor, block, context, finality }) {
      const logger = useLogger();

      logger.info(
        "Transforming block | orderKey: ",
        endCursor?.orderKey,
        " | finality: ",
        finality,
      );
    },
  });
}
