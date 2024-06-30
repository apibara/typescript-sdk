import { MockStream } from "@apibara/protocol/testing";
import { createIndexer, defineIndexer } from "../indexer";

export const mockIndexer = createIndexer(
  defineIndexer(MockStream)({
    streamUrl: "https://sepolia.ethereum.a5a.ch",
    finality: "accepted",
    filter: {},
    transform({ block: { blockNumber } }) {
      if (!blockNumber) return [];

      return [{ blockNumber: Number(blockNumber) }];
    },
  }),
);

export type MockRet = {
  blockNumber: number;
};
