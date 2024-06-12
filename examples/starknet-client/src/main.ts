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
  },
  async run({ args }) {
    consola.info("Connecting to Starknet stream", args.stream);
    const client = createClient(StarknetStream, args.stream);

    const response = await client.status();
    console.log(response);

    const filter = Filter.make({
      header: {
        always: true,
      },
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
          consola.info("Block", message.data.endCursor?.orderKey);
          for (const block of message.data.data) {
            consola.info("Block", block.header?.blockNumber);
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
