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
      transactions: [
        {
          includeBlob: true,
        },
      ],
    });

    const request = BeaconChainStream.Request.make({
      filter: [filter],
      finality: "accepted",
      startingCursor: {
        orderKey: 5_880_000n,
      },
    });

    for await (const message of client.streamData(request)) {
      switch (message._tag) {
        case "data": {
          consola.info("Data", message.data.endCursor?.orderKey);

          const maxBlobSize = 131_072; // bytes
          for (const block of message.data.data) {
            assert(block !== null);
            const transactions = block.transactions ?? [];
            const blobs = block.blobs ?? [];
            for (const tx of transactions) {
              const blob = blobs.find(
                (b) => b.transactionIndex === tx.transactionIndex,
              );
              if (blob) {
                consola.info(
                  `${tx.transactionHash} - ${blob.blob?.length ?? 0} bytes`,
                );
              } else {
                consola.info(`${tx.transactionHash} - no blob`);
              }
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
