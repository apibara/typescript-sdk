import consola from "consola";
import assert from "node:assert";
import { EvmStream } from "@apibara/evm";
import { defineIndexer, useIndexerContext } from "@apibara/indexer";
import { kv } from "@apibara/indexer/plugins";
import { encodeEventTopics, parseAbi, decodeEventLog } from "viem";
import { trace } from "@opentelemetry/api";

const abi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

const tracer = trace.getTracer("evm-indexer-demo");

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
      const ctx = useIndexerContext();
      ctx.counter += 1;

      return tracer.startActiveSpan("parseLogs", (span) => {
        const rows = logs.map((log) => {
          assert(log.topics.length === 3, "Transfer event has 3 topics");

          const { args } = tracer.startActiveSpan("decodeEventLog", (span) => {
            const decoded = decodeEventLog({
              abi,
              topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
              data: log.data,
              eventName: "Transfer",
            });

            span.end();
            return decoded;
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

        span.end();
        return rows;
      });
    },
    hooks: {
      "run:before"() {
        const ctx = useIndexerContext();
        ctx.counter = 0;
      },
      "handler:after"({ output }) {
        for (const transfer of output) {
          consola.debug(
            "Transfer",
            transfer.blockNumber,
            transfer.logIndex,
            transfer.from,
            transfer.to,
            transfer.value.toString(),
          );
        }
      },
      "sink:write"({ data }) {
        consola.info("Wrote", data.length, "transfers");
      },
      "sink:flush"() {
        consola.debug("Flushing");
      },
    },
    plugins: [kv()],
  });
}
