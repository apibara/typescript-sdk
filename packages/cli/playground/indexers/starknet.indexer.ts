import { defineIndexer } from "@apibara/indexer";
import { StarknetStream } from "@apibara/starknet";
import type { ApibaraRuntimeConfig } from "apibara/types";
import consola from "consola";
import { hash } from "starknet";

export default function indexer(runtimeConfig: ApibaraRuntimeConfig) {
  consola.log("--> Starknet Indexer Runtime Config: ", runtimeConfig);
  return defineIndexer(StarknetStream)({
    streamUrl: "https://starknet.preview.apibara.org",
    finality: "accepted",
    startingCursor: {
      orderKey: 800_000n,
    },
    filter: {
      events: [
        {
          address:
            "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
          keys: [hash.getSelectorFromName("Transfer") as `0x${string}`],
          includeReceipt: true,
        },
      ],
    },
    async transform({ block: { header, events } }) {
      consola.info(
        `Got block ${header?.blockNumber} with ${events.length} events`,
      );
    },
    hooks: {
      "handler:after": ({ endCursor }) => {
        consola.info("Handler After ", endCursor?.orderKey);
      },
    },
  });
}
