import {
  type MockBlock,
  type MockFilter,
  MockStream,
} from "@apibara/protocol/testing";
import { createIndexer, defineIndexer } from "../indexer";
import type { IndexerPlugin } from "../plugins";

export const getMockIndexer = (
  plugins: ReadonlyArray<IndexerPlugin<MockFilter, MockBlock, MockRet>> = [],
) =>
  createIndexer(
    defineIndexer(MockStream)({
      streamUrl: "https://sepolia.ethereum.a5a.ch",
      finality: "accepted",
      filter: {},
      transform({ block: { data } }) {
        if (!data) return [];

        return [{ data }];
      },
      plugins,
    }),
  );

export type MockRet = {
  data: string;
};
