import { runMain, defineCommand } from "citty";
import consola from "consola";
import { StarknetStream, Filter } from "@apibara/starknet";
import { createClient, RateGauge } from "@apibara/protocol";

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
  },
  async run({ args }) {
    consola.info("Connecting to Starknet stream", args.stream);
    const client = createClient(StarknetStream, args.stream);

    const response = await client.status();
    console.log(response);

    const filter = Filter.make({
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

    const blockRate = new RateGauge(10);
    const eventRate = new RateGauge(10);

    for await (const message of client.streamData(request)) {
      switch (message._tag) {
        case "data": {
          consola.info("Data", message.data.endCursor?.orderKey);

          let events = 0;
          for (const block of message.data.data) {
            events += block.events.length ?? 0;
            consola.info(`Block n=${block.header?.blockNumber} h=${block.header?.blockHash}`);
            consola.info(`   Events: ${block.events.length}`)
            consola.info(`   Messages: ${block.messages.length}`)
            consola.info(`   Transactions: ${block.transactions.length}`)
            consola.info(`   Receipts: ${block.receipts.length}`)
          }

          blockRate.record(message.data.data.length);
          eventRate.record(events);
          consola.info(`Block rate: ${blockRate.average()?.toFixed(0)}±${blockRate.variance().toFixed(0)} blocks/s`);
          consola.info(`Event rate: ${eventRate.average()?.toFixed(0)}±${eventRate.variance().toFixed(0)} events/s`);

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
