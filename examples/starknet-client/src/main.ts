import { runMain, defineCommand } from "citty";
import consola from "consola";
import { StarknetStream, Filter } from "@apibara/starknet";
import { createClient } from "@apibara/protocol";

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
      transactions: [
        {
          includeEvents: true,
          includeMessages: true,
          includeReceipt: true,
          includeReverted: true,
        },
      ],
      // header: {
      //   always: true,
      // },
      // events: [
      //   {
      //     // fromAddress: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
      //     // fromAddress: "0x07b696af58c967c1b14c9dde0ace001720635a660a8e90c565ea459345318b30",
      //     // fromAddress: "0x0",
      //     // includeReceipt: true,
      //     // includeTransaction: true,
      //     // includeSiblings: true,
      //     // includeMessages: true,
      //     // includeReverted: true,
      //     // keys: [null]
      //     // keys: []
      //   }
      // ],
      // transactions: [{
      //   includeEvents: true,
      // }],
    });

    const request = StarknetStream.Request.make({
      filter: [filter],
      finality: "accepted",
      startingCursor: {
        orderKey: 500_000n,
      },
    });

    for await (const message of client.streamData(request)) {
      switch (message._tag) {
        case "data": {
          consola.info("Data", message.data.endCursor?.orderKey);

          let events = 0;
          for (const block of message.data.data) {
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
