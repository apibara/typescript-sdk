import {
  type Client,
  ClientError,
  type Cursor,
  type DataFinality,
  type Finalize,
  type Heartbeat,
  type Invalidate,
  Status,
  type StreamConfig,
  type StreamDataOptions,
  type StreamDataRequest,
  type StreamDataResponse,
  type SystemMessage,
} from "@apibara/protocol";
import consola from "consola";
import {
  type Hookable,
  type NestedHooks,
  createDebugger,
  createHooks,
} from "hookable";

import assert from "node:assert";
import { type MiddlewareFunction, type NextFunction, compose } from "./compose";
import {
  type IndexerContext,
  indexerAsyncContext,
  useIndexerContext,
} from "./context";
import { createIndexerMetrics, createTracer } from "./otel";
import type { IndexerPlugin } from "./plugins";
import { useInternalContext } from "./plugins/context";

export type UseMiddlewareFunction = (
  fn: MiddlewareFunction<IndexerContext>,
) => void;

export interface IndexerHooks<TFilter, TBlock> {
  "run:before": () => void;
  "run:after": () => void;
  "connect:before": ({
    request,
    options,
  }: {
    request: StreamDataRequest<TFilter>;
    options: StreamDataOptions;
  }) => void;
  "connect:after": ({
    request,
  }: { request: StreamDataRequest<TFilter> }) => void;
  "connect:factory": ({
    request,
    endCursor,
  }: {
    request: StreamDataRequest<TFilter>;
    endCursor?: Cursor;
  }) => void;
  "handler:middleware": ({ use }: { use: UseMiddlewareFunction }) => void;
  message: ({ message }: { message: StreamDataResponse<TBlock> }) => void;
  "message:invalidate": ({ message }: { message: Invalidate }) => void;
  "message:finalize": ({ message }: { message: Finalize }) => void;
  "message:heartbeat": ({ message }: { message: Heartbeat }) => void;
  "message:systemMessage": ({ message }: { message: SystemMessage }) => void;
}

export type IndexerStartingCursor =
  | {
      startingCursor?: never;
      startingBlock: bigint;
    }
  | {
      startingCursor: Cursor;
      startingBlock?: never;
    }
  | {
      startingCursor?: never;
      startingBlock?: never;
    };

export type IndexerConfig<TFilter, TBlock> = {
  streamUrl: string;
  filter: TFilter;
  finality?: DataFinality;
  factory?: ({
    block,
    context,
  }: { block: TBlock; context: IndexerContext }) => Promise<{
    filter?: TFilter;
  }>;
  transform: (args: {
    block: TBlock;
    cursor?: Cursor | undefined;
    endCursor?: Cursor | undefined;
    finality: DataFinality;
    context: IndexerContext;
  }) => Promise<void>;
  hooks?: NestedHooks<IndexerHooks<TFilter, TBlock>>;
  plugins?: ReadonlyArray<IndexerPlugin<TFilter, TBlock>>;
  debug?: boolean;
} & IndexerStartingCursor;

export type IndexerWithStreamConfig<TFilter, TBlock> = IndexerConfig<
  TFilter,
  TBlock
> & {
  streamConfig: StreamConfig<TFilter, TBlock>;
};

export function defineIndexer<TFilter, TBlock>(
  streamConfig: StreamConfig<TFilter, TBlock>,
) {
  return (
    config: IndexerConfig<TFilter, TBlock>,
  ): IndexerWithStreamConfig<TFilter, TBlock> => ({
    streamConfig,
    ...config,
  });
}

export interface Indexer<TFilter, TBlock> {
  streamConfig: StreamConfig<TFilter, TBlock>;
  options: IndexerConfig<TFilter, TBlock>;
  hooks: Hookable<IndexerHooks<TFilter, TBlock>>;
}

export function createIndexer<TFilter, TBlock>({
  streamConfig,
  ...options
}: IndexerWithStreamConfig<TFilter, TBlock>) {
  const indexer: Indexer<TFilter, TBlock> = {
    options,
    streamConfig,
    hooks: createHooks<IndexerHooks<TFilter, TBlock>>(),
  };

  if (indexer.options.debug) {
    createDebugger(indexer.hooks, { tag: "indexer" });
  }

  indexer.hooks.addHooks(indexer.options.hooks ?? {});

  for (const plugin of indexer.options.plugins ?? []) {
    plugin(indexer);
  }

  return indexer;
}

export interface ReconnectOptions {
  maxRetries?: number;
  retryDelay?: number;
  maxWait?: number;
}

export async function runWithReconnect<TFilter, TBlock>(
  client: Client<TFilter, TBlock>,
  indexer: Indexer<TFilter, TBlock>,
  options: ReconnectOptions = {},
) {
  let retryCount = 0;

  const maxRetries = options.maxRetries ?? 10;
  const retryDelay = options.retryDelay ?? 1_000;
  const maxWait = options.maxWait ?? 30_000;

  const runOptions: RunOptions = {
    onConnect() {
      retryCount = 0;
    },
  };

  while (true) {
    try {
      await run(client, indexer, runOptions);
      return;
    } catch (error) {
      // Only reconnect on internal/server errors.
      // All other errors should be rethrown.

      retryCount++;

      if (error instanceof ClientError) {
        if (error.code === Status.INTERNAL) {
          if (retryCount < maxRetries) {
            consola.error(
              "Internal server error, reconnecting...",
              error.message,
            );

            // Add jitter to the retry delay to avoid all clients retrying at the same time.
            const delay = Math.random() * (retryDelay * 0.2) + retryDelay;
            await new Promise((resolve) =>
              setTimeout(resolve, Math.min(retryCount * delay, maxWait)),
            );

            continue;
          }
        }
      }

      throw error;
    }
  }
}

export interface RunOptions {
  onConnect?: () => void | Promise<void>;
}

export async function run<TFilter, TBlock>(
  client: Client<TFilter, TBlock>,
  indexer: Indexer<TFilter, TBlock>,
  runOptions: RunOptions = {},
) {
  await indexerAsyncContext.callAsync({}, async () => {
    const context = useIndexerContext();
    const middleware = await registerMiddleware(indexer);

    const indexerMetrics = createIndexerMetrics();
    const tracer = createTracer();

    await indexer.hooks.callHook("run:before");

    const { indexerName: indexerId } = useInternalContext();

    const isFactoryMode = indexer.options.factory !== undefined;

    // Give priority to startingCursor over startingBlock.
    let startingCursor: Cursor | undefined;
    if (indexer.options.startingCursor) {
      startingCursor = indexer.options.startingCursor;
    } else if (indexer.options.startingBlock !== undefined) {
      if (indexer.options.startingBlock === 0n) {
        startingCursor = undefined;
      } else if (indexer.options.startingBlock > 0n) {
        startingCursor = {
          orderKey: indexer.options.startingBlock - 1n,
        };
      }
    }

    // if factory mode we add a empty filter at the end of the filter array.
    const request = indexer.streamConfig.Request.make({
      filter: isFactoryMode
        ? [indexer.options.filter, {} as TFilter]
        : [indexer.options.filter],
      finality: indexer.options.finality,
      startingCursor,
    });

    const options: StreamDataOptions = {};

    await indexer.hooks.callHook("connect:before", { request, options });

    // store main filter, so later it can be merged
    let mainFilter: TFilter;
    if (isFactoryMode) {
      mainFilter = request.filter[1];
    }

    let stream: AsyncIterator<
      StreamDataResponse<TBlock>,
      StreamDataResponse<TBlock>
    > = client.streamData(request, options)[Symbol.asyncIterator]();

    await indexer.hooks.callHook("connect:after", { request });

    let onConnectCalled = false;

    while (true) {
      const { value: message, done } = await stream.next();

      if (done) {
        break;
      }

      if (!onConnectCalled) {
        onConnectCalled = true;
        if (runOptions.onConnect) {
          await runOptions.onConnect();
        }
      }

      await indexer.hooks.callHook("message", { message });

      switch (message._tag) {
        case "data": {
          await tracer.startActiveSpan("message data", async (span) => {
            const blocks = message.data.data;
            const { cursor, endCursor, finality } = message.data;

            context.cursor = cursor;
            context.endCursor = endCursor;
            context.finality = finality;

            // Record current block number being processed
            indexerMetrics.currentBlockGauge.record(
              Number(endCursor?.orderKey),
              {
                indexer_id: indexerId,
              },
            );

            await middleware(context, async () => {
              let block: TBlock | null;

              // when factory mode
              if (isFactoryMode && finality !== "pending") {
                assert(indexer.options.factory !== undefined);

                const [factoryBlock, mainBlock] = blocks;

                block = mainBlock;

                if (factoryBlock !== null) {
                  const { filter } = await indexer.options.factory({
                    block: factoryBlock,
                    context,
                  });

                  // write returned data from factory function if filter is not defined
                  if (filter) {
                    // when filter is defined
                    // merge old and new filters
                    mainFilter = indexer.streamConfig.mergeFilter(
                      mainFilter,
                      filter,
                    );

                    // create request with new filters
                    const request = indexer.streamConfig.Request.make({
                      filter: [indexer.options.filter, mainFilter],
                      finality: indexer.options.finality,
                      startingCursor: cursor,
                    });

                    await indexer.hooks.callHook("connect:factory", {
                      request,
                      endCursor,
                    });

                    // create new stream with new request
                    stream = client
                      .streamData(request, options)
                      [Symbol.asyncIterator]();

                    const { value: message } = await stream.next();

                    assert(message._tag === "data");

                    const [_factoryBlock, _block] = message.data.data;

                    block = _block;
                  }
                }
              } else {
                // when not in factory mode
                block = blocks[0];
              }

              // if block is not null
              if (block) {
                await tracer.startActiveSpan("handler", async (span) => {
                  await indexer.options.transform({
                    block,
                    cursor,
                    endCursor,
                    finality,
                    context,
                  });

                  span.end();
                });
              }
            });

            span.end();
          });

          // Record processed block metric
          indexerMetrics.processedBlockCounter.add(1, {
            indexer_id: indexerId,
          });

          context.cursor = undefined;
          context.endCursor = undefined;
          context.finality = undefined;

          break;
        }
        case "invalidate": {
          await tracer.startActiveSpan("message invalidate", async (span) => {
            // Record reorg metric
            indexerMetrics.reorgCounter.add(1, {
              indexer_id: indexerId,
            });
            await indexer.hooks.callHook("message:invalidate", { message });
            span.end();
          });
          break;
        }
        case "finalize": {
          await tracer.startActiveSpan("message finalize", async (span) => {
            await indexer.hooks.callHook("message:finalize", { message });
            span.end();
          });
          break;
        }
        case "heartbeat": {
          await tracer.startActiveSpan("message heartbeat", async (span) => {
            await indexer.hooks.callHook("message:heartbeat", { message });
            span.end();
          });
          break;
        }
        case "systemMessage": {
          await tracer.startActiveSpan(
            "message systemMessage",
            async (span) => {
              switch (message.systemMessage.output?._tag) {
                case "stderr": {
                  consola.warn(message.systemMessage.output.stderr);
                  break;
                }
                case "stdout": {
                  consola.info(message.systemMessage.output.stdout);
                  break;
                }
                default: {
                }
              }

              await indexer.hooks.callHook("message:systemMessage", {
                message,
              });
              span.end();
            },
          );
          break;
        }
        default: {
          consola.warn("unexpected message", message);
          throw new Error("not implemented");
        }
      }

      await indexer.hooks.callHook("run:after");
    }
  });
}

async function registerMiddleware<TFilter, TBlock>(
  indexer: Indexer<TFilter, TBlock>,
): Promise<MiddlewareFunction<IndexerContext>> {
  const middleware: MiddlewareFunction<IndexerContext>[] = [];
  const use = (fn: MiddlewareFunction<IndexerContext>) => {
    middleware.push(fn);
  };

  await indexer.hooks.callHook("handler:middleware", { use });

  const composed = compose(middleware);

  // Return a named function to help debugging
  return async function _composedIndexerMiddleware(
    context: IndexerContext,
    next?: NextFunction,
  ) {
    await composed(context, next);
  };
}
