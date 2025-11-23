import assert from "node:assert";
import { type EvmRpcFilter, createEvmRpcClient } from "@apibara/rpc-evm";
import { defineCommand, runMain } from "citty";
import consola from "consola";
import type { Chain } from "viem";
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
      default: "sepolia",
      description: "Network name (mainnet, sepolia)",
    },
    contract: {
      type: "string",
      default: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      description: "Contract address to monitor",
    },
    startBlock: {
      type: "string",
      default: "23857000",
      description: "Starting block number",
    },
    finality: {
      type: "string",
      default: "finalized",
      description: "Block finality (finalized, accepted, pending)",
    },
  },
  async run({ args }) {
    consola.info("Creating EVM RPC client");
    consola.info("Network:", args.network);

    const chain = (args.network === "mainnet" ? mainnet : sepolia) as Chain;

    const client = createEvmRpcClient(args.rpcUrl, chain, {
      initialBatchSize: 100n,
      minBatchSize: 10n,
      maxBatchSize: 1000n,
      retryCount: 3,
      retryDelay: 1000,
    });

    try {
      const status = await client.status();
      consola.success("Connected to RPC endpoint");
      consola.info("Current head:", status.currentHead?.orderKey);
      consola.info("Finalized:", status.finalized?.orderKey);
    } catch (error) {
      consola.error("Failed to connect:", error);
      process.exit(1);
    }

    const filter: EvmRpcFilter = {
      logs: [
        {
          address: args.contract as `0x${string}`,
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" as `0x${string}`,
          ],
        },
      ],
    };

    consola.info("Starting stream from block", args.startBlock);
    consola.info("Monitoring contract:", args.contract);
    consola.info("Finality:", args.finality);

    try {
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

              if (logs.length > 0) {
                consola.info(
                  `📦 Block ${block.header?.blockNumber} [${finality}/${production}]`,
                );
                consola.info("   Logs:", logs.length);

                for (const log of logs) {
                  consola.info("   🔔 Transfer Event");
                  consola.info("      Tx:", log.transactionHash);
                  consola.info("      Address:", log.address);
                  consola.info("      Topics:", log.topics.join(", "));
                  consola.info("      Log Index:", log.logIndex);
                }
              }
            }

            break;
          }

          case "invalidate": {
            consola.warn(
              "⚠️  Reorg detected! Invalidating to block",
              message.invalidate.cursor?.orderKey,
            );
            break;
          }

          case "finalize": {
            consola.success(
              "✅ Finalized up to block",
              message.finalize.cursor?.orderKey,
            );
            break;
          }

          case "heartbeat": {
            consola.info("💓 Heartbeat");
            break;
          }

          case "systemMessage": {
            const output = message.systemMessage.output;
            if (output._tag === "stderr") {
              consola.error("System error:", output.stderr);
            }
            break;
          }
        }
      }
    } catch (error) {
      consola.error("Stream error:", error);
      process.exit(1);
    }
  },
});

runMain(command);
