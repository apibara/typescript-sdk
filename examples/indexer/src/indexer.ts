import assert from "node:assert";
import { EvmStream } from "@apibara/evm";
import { defineIndexer, useIndexerContext } from "@apibara/indexer";
import { trace } from "@opentelemetry/api";
import consola from "consola";
import { encodeEventTopics, parseAbi } from "viem";

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
          }) as `0x${string}`[],
        },
      ],
    },
    async transform({ block: { header, logs, transactions } }) {
      const ctx = useIndexerContext();
      ctx.counter += 1;

      if (!transactions || !header || !header.number) return [];

      return tracer.startActiveSpan("parseLogs", (span) => {
        const rows = logs.map((log) => {
          assert(log.topics.length === 3, "Transfer event has 3 topics");

          const { args } = tracer.startActiveSpan("decodeEventLog", (span) => {
            // const decoded = decodeEventLog({
            //   abi,
            //   topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
            //   data: log.data,
            //   eventName: "Transfer",
            // });
            const decoded = { args: { from: "0x0", to: "0x0", value: "0" } };

            span.end();
            return decoded;
          });

          return {
            blockNumber: Number(header.number),
            blockHash: header.hash,
            logIndex: Number(log.logIndex),
            fromAddress: args.from,
            toAddress: args.to,
            value: Number(args.value),
          };
        });

        span.end();
        return rows;
      });
    },
    hooks: {
      async "run:before"() {},
      "handler:after"({ output }) {
        for (const transfer of output) {
          consola.debug(
            "Transfer",
            transfer.blockNumber,
            transfer.logIndex,
            transfer.fromAddress,
            transfer.toAddress,
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
    plugins: [],
  });
}
