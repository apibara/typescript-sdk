import { EvmStream, Filter } from "@apibara/evm";
import { createClient } from "@apibara/protocol";
import { defineCommand, runMain } from "citty";
import consola from "consola";
import { decodeEventLog, encodeEventTopics, parseAbi } from "viem";

const abi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

type Request = typeof EvmStream.Request.Type;

const command = defineCommand({
  meta: {
    name: "example-evm-client",
    version: "1.0.0",
    description: "Example showing how to connect to an EVM stream",
  },
  args: {
    stream: {
      type: "string",
      default: "https://sepolia.ethereum.a5a.ch",
      description: "EVM stream URL",
    },
    authToken: {
      type: "string",
      description: "DNA auth token",
    },
  },
  async run({ args }) {
    consola.info("Connecting to EVM stream", args.stream);
    const client = createClient(EvmStream, args.stream);

    const response = await client.status();
    console.log(response);

    const filter = Filter.make({
      header: {
        always: true,
      },
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
    });

    const request = EvmStream.Request.make({
      filter: [filter],
      finality: "accepted",
      startingCursor: {
        orderKey: 5_000_000n,
      },
    });

    for await (const message of client.streamData(request)) {
      switch (message._tag) {
        case "data": {
          consola.info("Block", message.data.endCursor?.orderKey);
          for (const block of message.data.data) {
            consola.info("Block", block.header?.number);
            for (const log of block.logs ?? []) {
              // const { args } = decodeEventLog({
              //   abi,
              //   // @ts-ignore
              //   topics: log.topics,
              //   data: log.data,
              //   eventName: "Transfer",
              // });
              // consola.info(
              //   "Log",
              //   log.logIndex,
              //   args.from,
              //   args.to,
              //   args.value.toString(),
              // );
            }
          }
          break;
        }
      }
    }
  },
});

runMain(command);
