import assert from "node:assert";
import { EvmStream, Filter } from "@apibara/evm";
import { createClient } from "@apibara/protocol";
import { defineCommand, runMain } from "citty";
import consola from "consola";
import { encodeEventTopics, parseAbi } from "viem";

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
      transactions: [{}],
      withdrawals: [{}],
      logs: [{}],
    });

    const request = EvmStream.Request.make({
      filter: [filter],
      finality: "accepted",
      startingCursor: {
        orderKey: 6_000_000n,
      },
    });

    for await (const message of client.streamData(request)) {
      switch (message._tag) {
        case "data": {
          consola.info("Block", message.data.endCursor?.orderKey);
          for (const block of message.data.data) {
            assert(block !== null);
            const logs = block.logs ?? [];
            const transactions = block.transactions ?? [];
            const withdrawals = block.withdrawals ?? [];
            const receipts = block.receipts ?? [];
            consola.info(
              `Block ${block.header?.blockNumber} logs=${logs.length} transactions=${transactions.length} withdrawals=${withdrawals.length} receipts=${receipts.length}`,
            );
          }
          break;
        }
      }
    }
  },
});

runMain(command);
