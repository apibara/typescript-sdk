import assert from "node:assert";
import { EvmRpcStream, type Filter } from "@apibara/evm-rpc";
import { createRpcClient } from "@apibara/protocol/rpc";
import { defineCommand, runMain } from "citty";
import consola from "consola";
import { http, type Chain, createPublicClient } from "viem";
import { mainnet, sepolia } from "viem/chains";

const command = defineCommand({
  meta: {
    name: "example-evm-rpc-client",
    version: "1.0.0",
    description: "Example showing how to connect to an EVM chain using RPC",
  },
  args: {
    rpcUrl: {
      type: "string",
      description: "EVM RPC endpoint URL (Alchemy, Infura, QuickNode, etc.)",
      required: true,
    },
    network: {
      type: "string",
      default: "mainnet",
      description: "Network name (mainnet, sepolia)",
    },
    contract: {
      type: "string",
      default: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      description: "Contract address to monitor",
    },
    startBlock: {
      type: "string",
      default: "23911400",
      description: "Starting block number",
    },
    finality: {
      type: "string",
      default: "finalized",
      description: "Block finality (finalized, accepted)",
    },
  },
  async run({ args }) {
    consola.info("Creating EVM RPC client");
    consola.info("Network:", args.network);

    const chain = (args.network === "mainnet" ? mainnet : sepolia) as Chain;

    const viemClient = createPublicClient({
      chain,
      transport: http(args.rpcUrl, {
        batch: {
          wait: 200,
        },
      }),
    });

    const client = createRpcClient(
      new EvmRpcStream(viemClient, {
        getLogsRangeSize: 100n,
      }),
    );

    const status = await client.status();
    consola.success("Connected to RPC endpoint");
    consola.info("Current head:", status.currentHead?.orderKey);
    consola.info("Finalized:", status.finalized?.orderKey);

    const filter: Filter = {
      header: "always",
      logs: [
        {
          id: 1,
          address: "0xe0e0e08A6A4b9Dc7bD67BCB7aadE5cF48157d444",
        },
        {
          id: 2,
          address: "0xA37cc341634AFD9E0919D334606E676dbAb63E17",
        },
        {
          id: 3,
          address: "0xe0e0e08A6A4b9Dc7bD67BCB7aadE5cF48157d444",
        },
      ],
    };

    consola.info("Starting stream from block", args.startBlock);
    consola.info("Monitoring contract:", args.contract);
    consola.info("Finality:", args.finality);

    for await (const message of client.streamData({
      filter: [filter],
      finality: args.finality as "finalized" | "accepted" | "pending",
      startingCursor: {
        orderKey: BigInt(args.startBlock),
      },
    })) {
      switch (message._tag) {
        case "data": {
          const { data, endCursor, finality, production } = message.data;

          for (const block of data) {
            assert(block !== null);
            const logs = block.logs;

            consola.info(
              `block ${block.header?.blockNumber} [${finality}/${production}]`,
            );
            consola.info("   logs:", logs.length);

            for (const log of logs) {
              // consola.info(log);
              // consola.info("   🔔 Log");
              // consola.info("      Tx:", log.transactionHash);
              // consola.info("      Address:", log.address);
              // consola.info("      Topics:", log.topics.join(", "));
              // consola.info("      Log Index:", log.logIndex);
            }
          }

          break;
        }

        case "invalidate": {
          consola.warn(
            "invalidating to block",
            message.invalidate.cursor?.orderKey,
          );
          break;
        }

        case "finalize": {
          consola.success(
            "finalized up to block",
            message.finalize.cursor?.orderKey,
          );
          break;
        }

        case "heartbeat": {
          consola.info("heartbeat");
          break;
        }

        case "systemMessage": {
          const output = message.systemMessage.output;
          if (output._tag === "stderr") {
            consola.error(output.stderr);
          } else {
            consola.info(output.stdout);
          }
          break;
        }
      }
    }
  },
});

runMain(command);
