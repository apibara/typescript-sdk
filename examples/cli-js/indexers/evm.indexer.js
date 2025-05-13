import { EvmStream } from "@apibara/evm";
import { defineIndexer } from "@apibara/indexer";

export default function (config) {
  console.log(config);
  return defineIndexer(EvmStream)({
    streamUrl: "https://sepolia.ethereum.a5a.ch",
    finality: "pending",
    clientOptions: {
      channelOptions: {
        "grpc.max_send_message_length": 100_000_000,
      },
    },
    startingBlock: 8_318_000n,
    filter: {
      logs: [
        {
          address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        },
      ],
    },
    async transform({ block: { header, logs }, finality, production }) {
      console.log(
        "Transforming block ",
        header.blockNumber,
        header.blockHash,
        finality,
        production,
        logs.length,
      );
    },
  });
}
