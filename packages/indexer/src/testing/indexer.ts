import {
  type MockBlock,
  type MockFilter,
  MockStream,
} from "@apibara/protocol/testing";
import { type IndexerConfig, createIndexer, defineIndexer } from "../indexer";
import type { IndexerPlugin } from "../plugins";
import type { Sink } from "../sink";

export const getMockIndexer = <TTxnParams>({
  plugins,
  sink,
  override,
}: {
  plugins?: ReadonlyArray<IndexerPlugin<MockFilter, MockBlock, TTxnParams>>;
  sink?: Sink<TTxnParams>;
  override?: Partial<IndexerConfig<MockFilter, MockBlock, TTxnParams>>;
} = {}) =>
  createIndexer(
    defineIndexer(MockStream)({
      streamUrl: "https://sepolia.ethereum.a5a.ch",
      finality: "accepted",
      filter: {},
      async transform({ block: { data }, context }) {
        // TODO
      },
      sink,
      plugins,
      ...override,
    }),
  );

export type MockRet = {
  data: string;
};
