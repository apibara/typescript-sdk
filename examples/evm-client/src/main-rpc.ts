import assert from "node:assert";
import { EvmRpcStream, type Filter, rateLimitedHttp } from "@apibara/evm-rpc";
import { createRpcClient } from "@apibara/protocol/rpc";
import { trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { Resource } from "@opentelemetry/resources";
import {
  BatchSpanProcessor,
  NodeTracerProvider,
} from "@opentelemetry/sdk-trace-node";
import { defineCommand, runMain } from "citty";
import consola from "consola";
import { createPublicClient } from "viem";

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
    contract: {
      type: "string",
      // default: "0xf08A50178dfcDe18524640EA6618a1f965821715",
      default: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      description: "Contract address to monitor",
    },
    startBlock: {
      type: "string",
      default: "7902564",
      description: "Starting block number",
    },
    finality: {
      type: "string",
      default: "accepted",
      description: "Block finality (finalized, accepted)",
    },
    trace: {
      type: "string",
      description:
        "Enable OpenTelemetry tracing and specify the OTLP gRPC endpoint URL (e.g. http://localhost:4317)",
    },
  },
  async run({ args }) {
    if (args.trace) {
      const provider = new NodeTracerProvider({
        resource: new Resource({
          "service.name": "example-evm-rpc-client",
        }),
      });

      const exporter = new OTLPTraceExporter({ url: args.trace });
      provider.addSpanProcessor(new BatchSpanProcessor(exporter));
      provider.register();

      trace.setGlobalTracerProvider(provider);

      consola.info("OpenTelemetry tracing enabled:", args.trace);
    }

    consola.info("Creating EVM RPC client");

    const viemClient = createPublicClient({
      transport: rateLimitedHttp(args.rpcUrl, {
        rps: 1, // Requests per second, to avoid rate limiting
        retryCount: 3,
        retryDelay: 1_000,
        batch: {
          wait: 10, // batch multiple requests together
        },
      }),
    });

    const client = createRpcClient(
      new EvmRpcStream(viemClient, {
        // This parameter changes based on the rpc provider.
        // The stream automatically shrinks the batch size when the provider returns an error.
        // getLogsRangeSize: 1_000n,
        getLogsRangeSize: 100n,
        mergeGetLogsFilter: "always",
        // alwaysSendAcceptedHeaders: true,
        headRefreshIntervalMs: 500,
      }),
    );

    const status = await client.status();
    consola.success("Connected to RPC endpoint");
    consola.info("Current head:", status.currentHead?.orderKey);
    consola.info("Finalized:", status.finalized?.orderKey);

    const filter: Filter = {
      logs: [
        {
          id: 1,
          address: args.contract as `0x${string}`,
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
          const { data } = message.data;

          for (const block of data) {
            assert(block !== null);
            const logs = block.logs;

            console.log(
              `block = ${block.header?.blockNumber} logs=${logs.length}`,
            );
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
