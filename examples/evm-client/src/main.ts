import { runMain, defineCommand } from "citty";
import consola from "consola";
import { encodeEventTopics, parseAbi } from "viem";
import { Filter, proto } from "@apibara/evm";
import {
  DnaStreamClient,
  DnaStreamDefinition,
  Cursor,
  StreamDataRequest,
  DataFinality,
} from "@apibara/protocol";
import { createChannel, createClient } from "nice-grpc";

const abi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

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
    const channel = createChannel(args.stream);
    const client: DnaStreamClient = createClient(DnaStreamDefinition, channel);

    const response = await client.status({});
    const head = Cursor.toJSON(response.currentHead!);
    consola.info(`EVM stream head=${head.orderKey} hash=${head.uniqueKey}`);

    const filter: Filter = {
      logs: [
        {
          strict: true,
          topics: encodeEventTopics({
            abi,
            eventName: "Transfer",
            args: { from: null, to: null },
          }),
        },
      ],
    };

    const request: StreamDataRequest = {
      startingCursor: {
        orderKey: 5_000_000n,
      },
      finality: DataFinality.ACCEPTED,
      filter: [Filter.encode(filter)],
    };

    const stream = client.streamData(StreamDataRequest.fromJSON(request));
    for await (const message of stream) {
      switch (message?.message?.$case) {
        case "data": {
          const endCursor = message.message.data.endCursor;
          const blockData = message.message.data.data[0];
          const block = proto.data.Block.decode(blockData);
          // console.log("Received data", block.header?.number, block.transactions?.length ?? 0);
          console.log(block.header?.number!);
          break;
        }
        default: {
          consola.info("Received message", message);
        }
      }
    }
  },
});

runMain(command);
