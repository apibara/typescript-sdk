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
    startingBlock: BigInt(22_211_000),
    filter: {
      logs: [
        {
          address: "0x8236a87084f8B84306f72007F36F2618A5634494",
        },
      ],
    },
    async transform({ block: { header, logs }, finality }) {
      console.log(
        "Transforming block ",
        header.blockNumber,
        header.blockHash,
        finality,
        logs.length,
      );
    },
  });
}
