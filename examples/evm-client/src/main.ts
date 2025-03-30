import assert from "node:assert";
import { EvmStream, Filter } from "@apibara/evm";
import { createClient } from "@apibara/protocol";
import { defineCommand, runMain } from "citty";
import consola from "consola";
import { parseAbi } from "viem";

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
      default: "https://ethereum-sepolia.preview.apibara.org",
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
      logs: [
        {
          address: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
          includeTransactionTrace: true,
        },
      ],
    });

    const request = EvmStream.Request.make({
      filter: [filter],
      finality: "accepted",
      startingCursor: {
        orderKey: 8_010_000n,
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
            const traces = block.traces ?? [];
            consola.info(
              `Block ${block.header?.blockNumber} logs=${logs.length} transactions=${transactions.length} withdrawals=${withdrawals.length} receipts=${receipts.length} traces=${traces.length}`,
            );
          }
          break;
        }
      }
    }
  },
});

runMain(command);
