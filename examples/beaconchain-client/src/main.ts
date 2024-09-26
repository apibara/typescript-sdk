import assert from "node:assert";
import { BeaconChainStream, Filter } from "@apibara/beaconchain";
import { createClient } from "@apibara/protocol";
import { defineCommand, runMain } from "citty";
import consola from "consola";

const command = defineCommand({
  meta: {
    name: "example-beaconchain-client",
    version: "1.0.0",
    description: "Example showing how to connect to a Beacon Chain stream",
  },
  args: {
    stream: {
      type: "string",
      default: "https://beaconchain-sepolia.preview.apibara.org",
      description: "Beacon Chain stream URL",
    },
    stopAtBlock: {
      type: "string",
      description: "Stop indexer at the given block",
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
  },
  async run({ args }) {
    consola.info("Connecting to Beacon Chain stream", args.stream);
    const client = createClient(BeaconChainStream, args.stream);

    const response = await client.status();
    console.log(response);

    const filter = Filter.make({
      // blobs: [{ includeTransaction: true }],
      transactions: [
        {
          // create: true,
          // to: "0xFf00000000000000000000000000000000102421",
          // to: "0xAD3C787556B1E9D32D3AE4f2A0B4b1dC6692eDAc",
          // includeBlob: true,
        },
      ],
    });

    const startBlock = 5_931_000;
    const stopAtBlock = Number(args.stopAtBlock);
    const request = BeaconChainStream.Request.make({
      filter: [filter],
      finality: "accepted",
      startingCursor: {
        orderKey: BigInt(startBlock),
      },
    });

    let total = 0;
    const cost = (17 / 1e6);
    const start = performance.now();
    for await (const message of client.streamData(request)) {
      switch (message._tag) {
        case "data": {
          consola.info("Data", message.data.endCursor?.orderKey);
          const blockNumber = Number(message.data.endCursor?.orderKey!);
          if (blockNumber >= stopAtBlock) {
            process.exit(0);
          }

          for (const block of message.data.data) {
            assert(block !== null);
            const transactions = block.transactions ?? [];
            const validators = block.validators ?? [];
            const blobs = block.blobs ?? [];
            total += transactions.length;
            const blocks = blockNumber - startBlock;
            const elapsed = (performance.now() - start) / 1000;
            const ts = total / elapsed;
            const bs = blocks / elapsed;
            consola.info(`Block ${block.header?.slot}: ${message.data.finality} t=${transactions.length} v=${validators.length} b=${blobs.length}`);
            consola.info(`Total ${total} ${(total * cost).toFixed(2)}$`);
            consola.info(`${ts.toFixed(2)} txs/sec ${bs.toFixed(2)} blocks/sec`);
            for (const tx of transactions) {
              const blob = blobs.find(
                (b) => b.transactionIndex === tx.transactionIndex,
              );
              // if (blob) {
              //   consola.info(
              //     `${tx.transactionHash} - ${blob.blob?.length ?? 0} bytes`,
              //   );
              // } else {
              //   consola.info(`${tx.transactionHash} - no blob`);
              // }
            }
          }

          break;
        }
        case "finalize": {
          consola.info("Finalize", message.finalize.cursor);
          break;
        }
        case "heartbeat": {
          consola.info("Heartbeat");
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
