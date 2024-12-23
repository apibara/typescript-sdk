import { isCursor } from "@apibara/protocol";
import {
  type MockBlock,
  type MockFilter,
  MockStream,
  type MockStreamResponse,
} from "@apibara/protocol/testing";

import { useIndexerContext } from "../context";
import { type IndexerConfig, createIndexer, defineIndexer } from "../indexer";
import { type IndexerPlugin, defineIndexerPlugin } from "../plugins";

export function generateMockMessages(count = 10): MockStreamResponse[] {
  return [...Array(count)].map((_, i) => ({
    _tag: "data",
    data: {
      cursor: { orderKey: BigInt(5_000_000 + i - 1) },
      finality: "accepted",
      data: [{ data: `${5_000_000 + i}` }],
      endCursor: { orderKey: BigInt(5_000_000 + i) },
    },
  }));
}

export function getMockIndexer({
  plugins,
  override,
}: {
  plugins?: ReadonlyArray<IndexerPlugin<MockFilter, MockBlock>>;
  override?: Partial<IndexerConfig<MockFilter, MockBlock>>;
} = {}) {
  return createIndexer(
    defineIndexer(MockStream)({
      streamUrl: "https://sepolia.ethereum.a5a.ch",
      finality: "accepted",
      filter: {},
      async transform({ block: { data }, context }) {},
      plugins,
      ...override,
    }),
  );
}

export type MockRet = {
  data: string;
};

/**
 * A mock sink used for testing. The indexer function can write to the output array.
 * The indexer context is optionally written to the metadata object.
 */
export function mockSink<TFilter, TBlock>({
  output,
  metadata,
}: { output: unknown[]; metadata?: Record<string, unknown> }) {
  return defineIndexerPlugin<TFilter, TBlock>((indexer) => {
    indexer.hooks.hook("connect:before", ({ request }) => {
      if (metadata?.lastCursor && isCursor(metadata.lastCursor)) {
        request.startingCursor = metadata.lastCursor;
      }

      if (metadata?.lastFilter) {
        request.filter[1] = metadata.lastFilter as TFilter;
      }
    });

    indexer.hooks.hook("connect:factory", ({ request, endCursor }) => {
      if (request.filter[1]) {
        if (metadata) {
          metadata.lastCursor = endCursor;
          metadata.lastFilter = request.filter[1];
        }
      }
    });

    indexer.hooks.hook("handler:middleware", ({ use }) => {
      use(async (context, next) => {
        context.output = output;
        await next();
        context.output = null;

        if (metadata) {
          metadata.lastCursor = context.endCursor;
        }
      });
    });
  });
}

export function useMockSink(): { output: unknown[] } {
  const context = useIndexerContext();
  return { output: context.output };
}
