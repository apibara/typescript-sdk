import { type MockBlock, MockStream } from "@apibara/protocol/testing";
import { createIndexer, defineIndexer } from "../indexer";
import type { IndexerPlugin } from "../plugins";

export const getMockIndexer = (
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  plugins: ReadonlyArray<IndexerPlugin<{}, MockBlock, MockRet>> = [],
) =>
  createIndexer(
    defineIndexer(MockStream)({
      streamUrl: "https://sepolia.ethereum.a5a.ch",
      finality: "accepted",
      filter: {},
      transform({ block: { blockNumber } }) {
        if (!blockNumber) return [];

        return [{ blockNumber: Number(blockNumber) }];
      },
      plugins,
    }),
  );

export type MockRet = {
  blockNumber: number;
};
