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
      default: "http://localhost:7007",
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
      blobs: [
        {
          includeTransaction: true,
        },
      ],
      // transactions: [{
      //   to: "0xff00000000000000000000000000000000042069",
      //   includeBlob: true,
      // }]
      // validators: [{}],
    });

    const request = BeaconChainStream.Request.make({
      filter: [filter],
      finality: "accepted",
      startingCursor: {
        orderKey: 5_200_000n,
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
            for (const blob of block.blobs) {
              if (blob.blob === undefined) continue;
              let i = blob.blob.length - 1;
              while (i >= 0 && blob.blob[i] === 0) i--;
              const utilization = (i / maxBlobSize) * 100;
              const tx = transactions.find(
                (tx) => tx.transactionIndex === blob.transactionIndex,
              );
              consola.info(
                `${blob.transactionHash} - ${utilization.toFixed(2)}%`,
              );
              consola.info(`    ${tx?.to}`);
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
