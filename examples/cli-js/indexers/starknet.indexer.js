import { defineIndexer } from "@apibara/indexer";
import { StarknetStream } from "@apibara/starknet";
import { hash } from "starknet";

export default defineIndexer(StarknetStream)({
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
        keys: [hash.getSelectorFromName("Transfer")],
        includeReceipt: true,
      },
    ],
  },
  async transform({ block: { header } }) {
    console.log("Transforming block ", header?.blockNumber);
  },
});
