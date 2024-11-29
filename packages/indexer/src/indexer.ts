import type {
  Client,
  Cursor,
  DataFinality,
  Finalize,
  Heartbeat,
  Invalidate,
  StreamConfig,
  StreamDataOptions,
  StreamDataRequest,
  StreamDataResponse,
  SystemMessage,
} from "@apibara/protocol";
import consola from "consola";
import {
  type Hookable,
  type NestedHooks,
  createDebugger,
  createHooks,
} from "hookable";

import assert from "node:assert";
import {
  type IndexerContext,
  indexerAsyncContext,
  useIndexerContext,
} from "./context";
import { tracer } from "./otel";
import type { IndexerPlugin } from "./plugins";
import { type Sink, defaultSink } from "./sink";

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
  "connect:after": () => void;
  "connect:factory": ({
    request,
    endCursor,
  }: {
    request: StreamDataRequest<TFilter>;
    endCursor?: Cursor;
  }) => void;
  "handler:before": ({
    block,
    finality,
    endCursor,
  }: {
    block: TBlock;
    finality: DataFinality;
    endCursor?: Cursor;
  }) => void;
  "handler:after": ({
    block,
    finality,
    endCursor,
  }: {
    block: TBlock;
    finality: DataFinality;
    endCursor?: Cursor;
  }) => void;
  "transaction:commit": ({
    finality,
    endCursor,
  }: {
    finality: DataFinality;
    endCursor?: Cursor;
  }) => void;
  "handler:exception": ({ error }: { error: Error }) => void;
  message: ({ message }: { message: StreamDataResponse<TBlock> }) => void;
  "message:invalidate": ({ message }: { message: Invalidate }) => void;
  "message:finalize": ({ message }: { message: Finalize }) => void;
  "message:heartbeat": ({ message }: { message: Heartbeat }) => void;
  "message:systemMessage": ({ message }: { message: SystemMessage }) => void;
}

export interface IndexerConfig<TFilter, TBlock, TTxnParams> {
  streamUrl: string;
  filter: TFilter;
  finality?: DataFinality;
  startingCursor?: Cursor;
  sink?: Sink<TTxnParams>;
  factory?: ({
    block,
    context,
  }: { block: TBlock; context: IndexerContext<TTxnParams> }) => Promise<{
    filter?: TFilter;
  }>;
  transform: (args: {
    block: TBlock;
    cursor?: Cursor | undefined;
    endCursor?: Cursor | undefined;
    finality: DataFinality;
    context: IndexerContext<TTxnParams>;
  }) => Promise<void>;
  hooks?: NestedHooks<IndexerHooks<TFilter, TBlock>>;
  plugins?: ReadonlyArray<IndexerPlugin<TFilter, TBlock, TTxnParams>>;
  debug?: boolean;
}

export interface IndexerWithStreamConfig<TFilter, TBlock, TTxnParams>
  extends IndexerConfig<TFilter, TBlock, TTxnParams> {
  streamConfig: StreamConfig<TFilter, TBlock>;
}

export function defineIndexer<TFilter, TBlock>(
  streamConfig: StreamConfig<TFilter, TBlock>,
) {
  return <TTxnParams>(
    config: IndexerConfig<TFilter, TBlock, TTxnParams>,
  ): IndexerWithStreamConfig<TFilter, TBlock, TTxnParams> => ({
    streamConfig,
    ...config,
  });
}

export interface Indexer<TFilter, TBlock, TTxnParams> {
  streamConfig: StreamConfig<TFilter, TBlock>;
  options: IndexerConfig<TFilter, TBlock, TTxnParams>;
  hooks: Hookable<IndexerHooks<TFilter, TBlock>>;
}

export function createIndexer<TFilter, TBlock, TTxnParams>({
  streamConfig,
  ...options
}: IndexerWithStreamConfig<TFilter, TBlock, TTxnParams>) {
  const indexer: Indexer<TFilter, TBlock, TTxnParams> = {
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

export async function run<TFilter, TBlock, TTxnParams>(
  client: Client<TFilter, TBlock>,
  indexer: Indexer<TFilter, TBlock, TTxnParams>,
) {
  await indexerAsyncContext.callAsync({}, async () => {
    const context = useIndexerContext<TTxnParams>();

    const sink = indexer.options.sink ?? defaultSink();

    context.sink = sink as Sink<TTxnParams>;

    await indexer.hooks.callHook("run:before");

    // Check if the it's factory mode or not
    const isFactoryMode = indexer.options.factory !== undefined;

    // if factory mode we add a empty filter
    const request = indexer.streamConfig.Request.make({
      filter: isFactoryMode
        ? [indexer.options.filter, {} as TFilter]
        : [indexer.options.filter],
      finality: indexer.options.finality,
      startingCursor: indexer.options.startingCursor,
    });

    const options: StreamDataOptions = {};

    await indexer.hooks.callHook("connect:before", { request, options });

    // avoid having duplicate data if it was inserted before the persistence commited the state
    await sink.invalidateOnRestart(request.startingCursor);

    // store main filter, so later it can be merged
    let mainFilter: TFilter;
    if (isFactoryMode) {
      mainFilter = request.filter[1];
    }

    // create stream
    let stream: AsyncIterator<
      StreamDataResponse<TBlock>,
      StreamDataResponse<TBlock>
    > = client.streamData(request, options)[Symbol.asyncIterator]();

    await indexer.hooks.callHook("connect:after");

    while (true) {
      const { value: message, done } = await stream.next();

      if (done) {
        break;
      }

      await indexer.hooks.callHook("message", { message });

      switch (message._tag) {
        case "data": {
          await tracer.startActiveSpan("message data", async (span) => {
            const blocks = message.data.data;
            const { cursor, endCursor, finality } = message.data;

            await sink.transaction(
              { cursor, endCursor, finality },
              async (txn) => {
                // attach transaction to context
                context.sinkTransaction = txn as TTxnParams;

                let block: TBlock | null;

                // when factory mode
                if (isFactoryMode) {
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
                    await indexer.hooks.callHook("handler:before", {
                      block,
                      endCursor,
                      finality,
                    });

                    try {
                      await indexer.options.transform({
                        block,
                        cursor,
                        endCursor,
                        finality,
                        context,
                      });
                      await indexer.hooks.callHook("handler:after", {
                        block,
                        finality,
                        endCursor,
                      });
                    } catch (error) {
                      assert(error instanceof Error);
                      await indexer.hooks.callHook("handler:exception", {
                        error,
                      });
                      throw error;
                    }

                    span.end();
                  });
                }
              },
            );
            await indexer.hooks.callHook("transaction:commit", {
              finality,
              endCursor,
            });
            span.end();
          });
          break;
        }
        case "invalidate": {
          await tracer.startActiveSpan("message invalidate", async (span) => {
            await sink.invalidate(message.invalidate.cursor);
            await indexer.hooks.callHook("message:invalidate", { message });
            span.end();
          });
          break;
        }
        case "finalize": {
          await tracer.startActiveSpan("message finalize", async (span) => {
            await sink.finalize(message.finalize.cursor);
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
