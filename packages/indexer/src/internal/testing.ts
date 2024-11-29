import type { Cursor } from "@apibara/protocol";
import type { MockStreamResponse } from "@apibara/protocol/testing";
import {
  type MockBlock,
  type MockFilter,
  MockStream,
} from "@apibara/protocol/testing";

import { type IndexerConfig, createIndexer, defineIndexer } from "../indexer";
import type { IndexerPlugin } from "../plugins";
import { Sink, type SinkCursorParams, type SinkData } from "../sink";

export function generateMockMessages(count = 10): MockStreamResponse[] {
  return [...Array(count)].map((_, i) => ({
    _tag: "data",
    data: {
      cursor: { orderKey: BigInt(5_000_000 - 1) },
      finality: "accepted",
      data: [{ data: `${5_000_000 + i}` }],
      endCursor: { orderKey: BigInt(5_000_000 + i) },
    },
  }));
}

export function getMockIndexer<TTxnParams>({
  plugins,
  sink,
  override,
}: {
  plugins?: ReadonlyArray<IndexerPlugin<MockFilter, MockBlock, TTxnParams>>;
  sink?: Sink<TTxnParams>;
  override?: Partial<IndexerConfig<MockFilter, MockBlock, TTxnParams>>;
} = {}) {
  return createIndexer(
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
}

export type MockRet = {
  data: string;
};

type TxnContext = {
  buffer: SinkData[];
};

type TxnParams = {
  writer: {
    insert: (data: SinkData[]) => void;
  };
};

const transactionHelper = (context: TxnContext) => {
  return {
    insert: (data: SinkData[]) => {
      context.buffer.push(...data);
    },
  };
};

export class MockSink extends Sink {
  public result: Array<{ endCursor?: Cursor; data: SinkData[] }> = [];

  write({ data, endCursor }: { data: SinkData[]; endCursor?: Cursor }) {
    if (data.length === 0) return;

    this.result.push({ data, endCursor });
  }

  async transaction(
    { cursor, endCursor, finality }: SinkCursorParams,
    cb: (params: TxnParams) => Promise<void>,
  ) {
    const context: TxnContext = {
      buffer: [],
    };

    const writer = transactionHelper(context);

    await cb({ writer });
    this.write({ data: context.buffer, endCursor });
  }

  async invalidateOnRestart(cursor?: Cursor) {
    // No Implementation required
  }

  async invalidate(cursor?: Cursor) {
    // TODO: Implement
    throw new Error("Not implemented");
  }

  async finalize(cursor?: Cursor) {
    // No Implementation required
  }
}

export function mockSink() {
  return new MockSink();
}
