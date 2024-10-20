import assert from "node:assert";
import { createClient } from "@apibara/protocol";
import { Filter, StarknetStream } from "@apibara/starknet";
import { defineCommand, runMain } from "citty";
import consola from "consola";

const command = defineCommand({
  meta: {
    name: "example-evm-client",
    version: "1.0.0",
    description: "Example showing how to connect to a Starknet stream",
  },
  args: {
    stream: {
      type: "string",
      default: "http://localhost:7007",
      description: "Starknet stream URL",
    },
    authToken: {
      type: "string",
      description: "DNA auth token",
    },
    headers: {
      type: "boolean",
      description: "Log headers",
      default: false,
    },
    events: {
      type: "boolean",
      description: "Log events",
      default: false,
    },
    messages: {
      type: "boolean",
      description: "Log messages",
      default: false,
    },
    transactions: {
      type: "boolean",
      description: "Log transactions",
      default: false,
    },
    receipts: {
      type: "boolean",
      description: "Log receipts",
      default: false,
    },
  },
  async run({ args }) {
    consola.info("Connecting to Starknet stream", args.stream);
    const client = createClient(StarknetStream, args.stream);

    const response = await client.status();
    console.log(response);

    const filter = Filter.make({
      header: "on_data_or_on_new_block",
      messages: [
        {
          fromAddress:
            "0x074761a8d48ce002963002becc6d9c3dd8a2a05b1075d55e5967f42296f16bd0",
        },
      ],
      transactions: [
        {
          transactionStatus: "all",
        },
      ],
      events: [
        {
          address:
            "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
        },
      ],
    });

    const request = StarknetStream.Request.make({
      filter: [filter],
      finality: "accepted",
      startingCursor: {
        orderKey: 800_000n,
      },
    });

    for await (const message of client.streamData(request)) {
      switch (message._tag) {
        case "data": {
          consola.info("Data", message.data.endCursor?.orderKey);

          let events = 0;
          for (const block of message.data.data) {
            assert(block !== null);
            events += block.events.length ?? 0;
            consola.info(
              `Block n=${block.header?.blockNumber} h=${block.header?.blockHash}`,
            );
            consola.info(`   Events: ${block.events.length}`);
            consola.info(`   Messages: ${block.messages.length}`);
            consola.info(`   Transactions: ${block.transactions.length}`);
            consola.info(`   Receipts: ${block.receipts.length}`);

            if (args.headers) {
              consola.log(block.header);
            }

            if (args.events) {
              for (const event of block.events) {
                consola.log(event);
              }
            }

            if (args.messages) {
              for (const message of block.messages) {
                consola.log(message);
              }
            }

            if (args.transactions) {
              for (const transaction of block.transactions) {
                consola.log(transaction);
              }
            }

            if (args.receipts) {
              for (const receipt of block.receipts) {
                consola.log(receipt);
              }
            }
          }

          break;
        }
        case "systemMessage": {
          switch (message.systemMessage.output?._tag) {
            case "stdout": {
              consola.info(message.systemMessage.output.stdout);
              break;
            }
            case "stderr": {
              consola.warn(message.systemMessage.output.stderr);
              break;
            }
          }
          break;
        }
      }
    }
  },
});

runMain(command);
