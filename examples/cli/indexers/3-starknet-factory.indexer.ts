import { defineIndexer } from "@apibara/indexer";
import { useLogger } from "@apibara/indexer/plugins/logger";
import { StarknetStream } from "@apibara/starknet";
import type { ApibaraRuntimeConfig } from "apibara/types";
import { hash } from "starknet";

const PAIR_CREATED = hash.getSelectorFromName("PairCreated") as `0x${string}`;
const SWAP = hash.getSelectorFromName("Swap") as `0x${string}`;

export default function (runtimeConfig: ApibaraRuntimeConfig) {
  return defineIndexer(StarknetStream)({
    streamUrl: "https://starknet.preview.apibara.org",
    finality: "accepted",
    startingCursor: {
      orderKey: 800_000n,
    },
    filter: {
      header: "always",
      events: [
        {
          address:
            "0x00dad44c139a476c7a17fc8141e6db680e9abc9f56fe249a105094c44382c2fd",
          keys: [PAIR_CREATED],
        },
      ],
    },
    async factory({ block: { events } }) {
      const logger = useLogger();

      const poolEvents = (events ?? []).flatMap((event) => {
        const pairAddress = event.data?.[2];

        logger.log(`Factory: PairAddress - ${pairAddress}`);
        return {
          address: pairAddress,
          keys: [SWAP],
          includeReceipt: false,
        };
      });
      return {
        filter: {
          header: "always",
          events: poolEvents,
        },
      };
    },
    async transform({ block, endCursor }) {
      const logger = useLogger();
      logger.log("Transforming ", endCursor?.orderKey);
    },
  });
}
