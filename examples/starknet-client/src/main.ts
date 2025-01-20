import assert from "node:assert";
import { createClient } from "@apibara/protocol";
import { type Abi, Filter, StarknetStream } from "@apibara/starknet";
import { defineCommand, runMain } from "citty";
import consola from "consola";

const abi = [
  {
    kind: "struct",
    name: "Transfer",
    type: "event",
    members: [
      {
        kind: "data",
        name: "from",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "to",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "value",
        type: "core::integer::u256",
      },
    ],
  },
] as const satisfies Abi;

const command = defineCommand({
  meta: {
    name: "example-evm-client",
    version: "1.0.0",
    description: "Example showing how to connect to a Starknet stream",
  },
  args: {
    stream: {
      type: "string",
      default: "https://starknet.preview.apibara.org",
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
      transactions: [{ includeReceipt: true }],
      messages: [{}],
      events: [{}],
      storageDiffs: [{}],
      contractChanges: [{}],
      nonceUpdates: [{}],
    });

    const request = StarknetStream.Request.make({
      filter: [filter],
      finality: "pending",
      startingCursor: {
        orderKey: 1_083_705n,
      },
    });

    for await (const message of client.streamData(request, {
      timeout: 40_000,
    })) {
      switch (message._tag) {
        case "data": {
          consola.info("Data", message.data.endCursor?.orderKey);

          let events = 0;
          for (const block of message.data.data) {
            assert(block !== null);
            events += block.events.length ?? 0;
            consola.info(
              `Block n=${block.header?.blockNumber} h=${block.header?.blockHash}`,
            );

            for (const event of block.events) {
              // const { args, transactionHash } = decodeEvent({
              //   abi,
              //   eventName: "Transfer",
              //   event,
              // });
              // consola.info(
              //   `${prettyAddress(args.from)} -> ${prettyAddress(args.to)} ${formatUnits(args.value, 6)} ${colors.gray(transactionHash ?? "")}`,
              // );
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

function prettyAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

runMain(command);
