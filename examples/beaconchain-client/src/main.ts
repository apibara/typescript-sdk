import { createClient } from "@apibara/protocol";
import { Filter, BeaconChainStream } from "@apibara/beaconchain";
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
      header: {
        always: true,
      }
    });

    const request = BeaconChainStream.Request.make({
      filter: [filter],
      finality: "accepted",
      startingCursor: {
        orderKey: 5_000_000n,
      },
    });

    for await (const message of client.streamData(request)) {
      switch (message._tag) {
        case "data": {
          consola.info("Data", message.data.endCursor?.orderKey);

          for (const block of message.data.data) {
            console.log(block);
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
