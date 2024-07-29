import { EvmStream } from "@apibara/evm";
import { defineIndexer } from "@apibara/indexer";
import { encodeEventTopics, parseAbi } from "viem";

const abi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

// TODO: `runtimeConfig` type should come from the generated types file
export default function indexer(runtimeConfig: unknown) {
  console.log("runtimeConfig", runtimeConfig);
  return defineIndexer(EvmStream)({
    streamUrl: "https://sepolia.ethereum.a5a.ch",
    finality: "accepted",
    startingCursor: {
      orderKey: 5_000_000n,
    },
    filter: {
      logs: [
        {
          strict: true,
          topics: encodeEventTopics({
            abi,
            eventName: "Transfer",
            args: { from: null, to: null },
          }) as `0x${string}`[],
        },
      ],
    },
    async transform({ block: { header } }) {
      return [header];
    },
  })
}
