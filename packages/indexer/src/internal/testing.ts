import { type Finalize, type Invalidate, isCursor } from "@apibara/protocol";
import {
  type MockBlock,
  type MockFilter,
  MockStream,
  type MockStreamResponse,
} from "@apibara/protocol/testing";
import { useIndexerContext } from "../context";
import { type IndexerConfig, createIndexer, defineIndexer } from "../indexer";
import { defineIndexerPlugin, logger } from "../plugins";
import { type InternalContext, internalContext } from "./plugins";

export type MockMessagesOptions = {
  invalidate?: {
    invalidateFromIndex: number;
    invalidateTriggerIndex: number;
  };
  finalize?: {
    finalizeToIndex: number;
    finalizeTriggerIndex: number;
  };
  uniqueKey?: boolean;
  baseBlockNumber?: bigint;
};

export function generateMockMessages(
  count = 10,
  options?: MockMessagesOptions,
): MockStreamResponse[] {
  const invalidateAt = options?.invalidate;
  const finalizeAt = options?.finalize;
  const messages: MockStreamResponse[] = [];

  const baseBlockNumber = options?.baseBlockNumber ?? BigInt(5_000_000);

  for (let i = 0; i < count; i++) {
    const currentBlockNumber = baseBlockNumber + BigInt(i);
    const uniqueKey = uniqueKeyFromOrderKey(currentBlockNumber);
    if (invalidateAt && i === invalidateAt.invalidateTriggerIndex) {
      const invalidateToBlock =
        baseBlockNumber + BigInt(invalidateAt.invalidateFromIndex);
      messages.push({
        _tag: "invalidate",
        invalidate: {
          cursor: {
            orderKey: invalidateToBlock,
            uniqueKey: options?.uniqueKey
              ? uniqueKeyFromOrderKey(invalidateToBlock)
              : undefined,
          },
        },
      } as Invalidate);
    } else if (finalizeAt && i === finalizeAt.finalizeTriggerIndex) {
      const fianlizedToBlock =
        baseBlockNumber + BigInt(finalizeAt.finalizeToIndex);
      messages.push({
        _tag: "finalize",
        finalize: {
          cursor: {
            orderKey: fianlizedToBlock,
            uniqueKey: options?.uniqueKey
              ? uniqueKeyFromOrderKey(fianlizedToBlock)
              : undefined,
          },
        },
      } as Finalize);
    } else {
      messages.push({
        _tag: "data",
        data: {
          cursor: { orderKey: currentBlockNumber - 1n },
          finality: "accepted",
          data: [{ data: `${baseBlockNumber + BigInt(i)}` }],
          endCursor: {
            orderKey: currentBlockNumber,
            uniqueKey: options?.uniqueKey ? uniqueKey : undefined,
          },
          production: "backfill",
        },
      });
    }
  }

  return messages;
}

function uniqueKeyFromOrderKey(orderKey: bigint): `0x${string}` {
  return `0xff00${orderKey.toString()}`;
}

type MockIndexerParams = {
  internalContext?: InternalContext;
  override?: Partial<IndexerConfig<MockFilter, MockBlock>>;
};

export function getMockIndexer(params?: MockIndexerParams) {
  const { internalContext: contextParams, override } = params ?? {};
  const { plugins, ...rest } = override ?? {};

  return createIndexer(
    defineIndexer(MockStream)({
      streamUrl: "https://sepolia.ethereum.a5a.ch",
      finality: "accepted",
      filter: {},
      async transform() {},
      plugins: [
        logger(),
        internalContext(
          contextParams ??
            ({
              availableIndexers: ["testing"],
              indexerName: "testing",
            } as InternalContext),
        ),
        ...(plugins ?? []),
      ],
      ...(rest ?? {}),
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
