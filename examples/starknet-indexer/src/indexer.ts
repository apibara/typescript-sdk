import assert from "node:assert";
import { getReceipt, getTransaction, StarknetStream } from "@apibara/starknet";
import { defineIndexer, useIndexerContext } from "@apibara/indexer";
import consola from "consola";

export function createIndexerConfig(streamUrl: string) {
  return defineIndexer(StarknetStream)({
    streamUrl,
    finality: "accepted",
    startingCursor: {
      orderKey: 300_000n,
    },
    filter: {
      events: [
        {
          fromAddress: "0x00000005dd3D2F4429AF886cD1a3b08289DBcEa99A294197E9eB43b0e0325b4b",
          includeReceipt: true,
          includeTransaction: true,
        }
      ]
    },
    async transform({ block: { header, events, transactions, receipts } }) {
      const ts = header?.timestamp!;
      for (const event of events) {
        // Use helpers to access transaction and receipt
        const tx = getTransaction(event.transactionIndex!, transactions ?? []);
        const receipt = getReceipt(event.transactionIndex!, receipts ?? []);

        consola.info({
          ts,
          eventIndex: event.eventIndex,
          actualFee: receipt?.meta?.actualFee,
          txType: tx?.transaction?._tag,
        });
      }
      return [];
    },
  });
}
