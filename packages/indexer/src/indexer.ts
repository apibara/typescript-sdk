import {
  type Client,
  ClientError,
  type CreateClientOptions,
  type Cursor,
  type DataFinality,
  type DataProduction,
  type Finalize,
  type Invalidate,
  ServerError,
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
import { reloadIfNeeded } from "./utils";

export type UseMiddlewareFunction = (
  fn: MiddlewareFunction<IndexerContext>,
) => void;

export interface IndexerHooks<TFilter, TBlock> {
  "plugins:init": ({ abortSignal }: { abortSignal?: AbortSignal }) => void;
  "run:before": ({ abortSignal }: { abortSignal?: AbortSignal }) => void;
  "run:after": ({ abortSignal }: { abortSignal?: AbortSignal }) => void;
  "connect:before": ({
    request,
    options,
  }: {
    request: StreamDataRequest<TFilter>;
    options: StreamDataOptions;
    abortSignal?: AbortSignal;
  }) => void;
  "connect:after": ({
    request,
  }: {
    request: StreamDataRequest<TFilter>;
    abortSignal?: AbortSignal;
  }) => void;
  "connect:factory": ({
    request,
    endCursor,
    abortSignal,
  }: {
    request: StreamDataRequest<TFilter>;
    endCursor?: Cursor;
    abortSignal?: AbortSignal;
  }) => void;
  "handler:middleware": ({
    use,
    abortSignal,
  }: { use: UseMiddlewareFunction; abortSignal?: AbortSignal }) => void;
  message: ({
    message,
    abortSignal,
  }: {
    message: StreamDataResponse<TBlock>;
    abortSignal?: AbortSignal;
  }) => void;
  "message:invalidate": ({
    message,
    abortSignal,
  }: { message: Invalidate; abortSignal?: AbortSignal }) => void;
  "message:finalize": ({
    message,
    abortSignal,
  }: { message: Finalize; abortSignal?: AbortSignal }) => void;
  "message:heartbeat": ({ abortSignal }: { abortSignal?: AbortSignal }) => void;
  "message:systemMessage": ({
    message,
    abortSignal,
  }: { message: SystemMessage; abortSignal?: AbortSignal }) => void;
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

export type HandlerArgs<TBlock> = {
  block: TBlock;
  cursor?: Cursor | undefined;
  endCursor?: Cursor | undefined;
  finality: DataFinality;
  production: DataProduction;
  context: IndexerContext;
  abortSignal?: AbortSignal;
};

export type IndexerConfig<TFilter, TBlock> = {
  streamUrl: string;
  filter: TFilter;
  finality?: DataFinality;
  clientOptions?: CreateClientOptions;
  factory?: (args: HandlerArgs<TBlock>) => Promise<{
    filter?: TFilter;
  }>;
  transform: (args: HandlerArgs<TBlock>) => Promise<void>;
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

  while (true) {
    const abortController = new AbortController();

    const runOptions: RunOptions = {
      onConnect() {
        retryCount = 0;
      },
      abortSignal: abortController.signal,
    };

    try {
      await run(client, indexer, runOptions);
      abortController.abort();
      return;
    } catch (error) {
      // Only reconnect on internal/server errors.
      // All other errors should be rethrown.

      retryCount++;

      abortController.abort();

      if (error instanceof ClientError || error instanceof ServerError) {
        const isServerError = error instanceof ServerError;

        if (error.code === Status.INTERNAL) {
          if (retryCount < maxRetries) {
            consola.error(
              `Internal ${isServerError ? "server" : "client"} error: ${
                error.message
              }`,
            );
            consola.start("Reconnecting...");
            console.log();

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
  abortSignal?: AbortSignal;
}

export async function run<TFilter, TBlock>(
  client: Client<TFilter, TBlock>,
  indexer: Indexer<TFilter, TBlock>,
  runOptions: RunOptions = {},
) {
  await indexerAsyncContext.callAsync({}, async () => {
    const context = useIndexerContext();

    if (indexer.options.debug) {
      context.debug = true;
    }

    const { abortSignal } = runOptions;

    await indexer.hooks.callHook("plugins:init", { abortSignal });

    const middleware = await registerMiddleware(indexer, abortSignal);

    const indexerMetrics = createIndexerMetrics();
    const tracer = createTracer();

    await indexer.hooks.callHook("run:before", { abortSignal });

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
    const request = {
      filter: isFactoryMode
        ? [indexer.options.filter, {} as TFilter]
        : [indexer.options.filter],
      finality: indexer.options.finality,
      startingCursor,
    } as StreamDataRequest<TFilter>;

    const options: StreamDataOptions = {};

    await indexer.hooks.callHook("connect:before", {
      request,
      options,
      abortSignal,
    });

    // store main filter, so later it can be merged
    let mainFilter: TFilter;
    if (isFactoryMode) {
      mainFilter = request.filter[1];
    }

    let stream: AsyncIterator<
      StreamDataResponse<TBlock>,
      StreamDataResponse<TBlock>
    > = client.streamData(request, options)[Symbol.asyncIterator]();

    await indexer.hooks.callHook("connect:after", { request, abortSignal });

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

      await indexer.hooks.callHook("message", { message, abortSignal });

      switch (message._tag) {
        case "data": {
          await tracer.startActiveSpan("message data", async (span) => {
            const blocks = message.data.data;
            const { cursor, endCursor, finality, production } = message.data;

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

            reloadIfNeeded();

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
                    cursor,
                    endCursor,
                    finality,
                    production,
                    context,
                    abortSignal,
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
                    const request = {
                      filter: [indexer.options.filter, mainFilter],
                      finality: indexer.options.finality,
                      startingCursor: cursor,
                    } as StreamDataRequest<TFilter>;

                    await indexer.hooks.callHook("connect:factory", {
                      request,
                      endCursor,
                      abortSignal,
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
                    production,
                    context,
                    abortSignal,
                  });

                  span.end();
                });
              }
            });

            reloadIfNeeded();

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
            await indexer.hooks.callHook("message:invalidate", {
              message: message.invalidate,
              abortSignal,
            });
            span.end();
          });
          break;
        }
        case "finalize": {
          await tracer.startActiveSpan("message finalize", async (span) => {
            await indexer.hooks.callHook("message:finalize", {
              message: message.finalize,
              abortSignal,
            });
            span.end();
          });
          break;
        }
        case "heartbeat": {
          await tracer.startActiveSpan("message heartbeat", async (span) => {
            reloadIfNeeded();

            await indexer.hooks.callHook("message:heartbeat", { abortSignal });
            reloadIfNeeded();

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
                message: message.systemMessage,
                abortSignal,
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

      await indexer.hooks.callHook("run:after", { abortSignal });
    }
  });
}

async function registerMiddleware<TFilter, TBlock>(
  indexer: Indexer<TFilter, TBlock>,
  abortSignal?: AbortSignal,
): Promise<MiddlewareFunction<IndexerContext>> {
  const middleware: MiddlewareFunction<IndexerContext>[] = [];
  const use = (fn: MiddlewareFunction<IndexerContext>) => {
    middleware.push(fn);
  };

  await indexer.hooks.callHook("handler:middleware", { use, abortSignal });

  const composed = compose(middleware);

  // Return a named function to help debugging
  return async function _composedIndexerMiddleware(
    context: IndexerContext,
    next?: NextFunction,
  ) {
    await composed(context, next);
  };
}
