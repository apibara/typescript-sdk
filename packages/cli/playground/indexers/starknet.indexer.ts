import { defineIndexer } from "@apibara/indexer";
import { StarknetStream } from "@apibara/starknet";
import type { ApibaraRuntimeConfig } from "apibara/types";
import consola from "consola";
import { hash } from "starknet";

export default function indexer(runtimeConfig: ApibaraRuntimeConfig) {
  consola.log("--> Starknet Indexer Runtime Config: ", runtimeConfig);
  return defineIndexer(StarknetStream)({
    streamUrl: "http://mainnet-v2.starknet.a5a.ch:7007",
    finality: "accepted",
    startingCursor: {
      orderKey: 80_000n,
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
      consola.info("Transforming block ", header?.blockNumber);
    },
    hooks: {
      "handler:after": ({ endCursor }) => {
        consola.info("Handler After ", endCursor?.orderKey);
      },
    },
  });
}
