import consola from "consola";
import assert from "node:assert";
import { EvmStream } from "@apibara/evm";
import { defineIndexer } from "@apibara/indexer";
import { encodeEventTopics, parseAbi, decodeEventLog } from "viem";

const abi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

export function createIndexerConfig(streamUrl: string) {
  return defineIndexer(EvmStream)({
    streamUrl,
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
          }),
        },
      ],
    },
    transform({ header, logs }) {
      return logs.map((log) => {
        assert(log.topics.length === 3, "Transfer event has 3 topics");

        const { args } = decodeEventLog({
          abi,
          topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
          data: log.data,
          eventName: "Transfer",
        });

        return {
          blockNumber: header?.number,
          blockHash: header?.hash,
          logIndex: log.logIndex,
          from: args.from,
          to: args.to,
          value: args.value,
        };
      });
    },
    hooks: {
      "handler:after": ({ output }) => {
        for (const transfer of output) {
          consola.info(
            "Transfer",
            transfer.blockNumber,
            transfer.logIndex,
            transfer.from,
            transfer.to,
            transfer.value.toString(),
          );
        }
      },
    },
  });
}
