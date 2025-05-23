import { defineIndexer } from "@apibara/indexer";
import { StarknetStream } from "@apibara/starknet";
import { hash } from "starknet";

export default function (config) {
  console.log(config);
  return defineIndexer(StarknetStream)({
    streamUrl: "https://mainnet.starknet.a5a.ch",
    finality: "pending",
    clientOptions: {
      channelOptions: {
        "grpc.max_send_message_length": 100_000_000,
      },
    },
    startingCursor: {
      orderKey: 1_380_000n,
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
      console.log("Transforming block ", header.blockNumber, header.blockHash);
    },
  });
}
