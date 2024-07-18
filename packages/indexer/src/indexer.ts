import type {
  Client,
  Cursor,
  DataFinality,
  StreamConfig,
  StreamDataOptions,
  StreamDataRequest,
  StreamDataResponse,
} from "@apibara/protocol";
import consola from "consola";
import {
  type Hookable,
  type NestedHooks,
  createDebugger,
  createHooks,
} from "hookable";

import assert from "node:assert";
import { indexerAsyncContext } from "./context";
import { tracer } from "./otel";
import type { IndexerPlugin } from "./plugins";
import { type Sink, type SinkData, defaultSink } from "./sink";

export interface IndexerHooks<TFilter, TBlock, TRet> {
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
  "handler:after": ({ output }: { output: TRet[] }) => void;
  "handler:exception": ({ error }: { error: Error }) => void;
  "sink:write": ({ data }: { data: TRet[] }) => void;
  "sink:flush": ({
    endCursor,
    finality,
  }: { endCursor?: Cursor; finality: DataFinality }) => void;
  message: ({ message }: { message: StreamDataResponse<TBlock> }) => void;
}

export interface IndexerConfig<TFilter, TBlock, TRet> {
  streamUrl: string;
  filter: TFilter;
  finality?: DataFinality;
  startingCursor?: Cursor;
  factory?: (block: TBlock) => Promise<{ filter?: TFilter; data?: TRet[] }>;
  transform: (args: {
    block: TBlock;
    cursor?: Cursor | undefined;
    endCursor?: Cursor | undefined;
    finality: DataFinality;
  }) => Promise<TRet[]>;
  hooks?: NestedHooks<IndexerHooks<TFilter, TBlock, TRet>>;
  plugins?: ReadonlyArray<IndexerPlugin<TFilter, TBlock, TRet>>;
  debug?: boolean;
}

export interface IndexerWithStreamConfig<TFilter, TBlock, TRet>
  extends IndexerConfig<TFilter, TBlock, TRet> {
  streamConfig: StreamConfig<TFilter, TBlock>;
}

export function defineIndexer<TFilter, TBlock>(
  streamConfig: StreamConfig<TFilter, TBlock>,
) {
  return <TRet>(
    config: IndexerConfig<TFilter, TBlock, TRet>,
  ): IndexerWithStreamConfig<TFilter, TBlock, TRet> => ({
    streamConfig,
    ...config,
  });
}

export interface Indexer<TFilter, TBlock, TRet> {
  streamConfig: StreamConfig<TFilter, TBlock>;
  options: IndexerConfig<TFilter, TBlock, TRet>;
  hooks: Hookable<IndexerHooks<TFilter, TBlock, TRet>>;
}

export function createIndexer<TFilter, TBlock, TRet>({
  streamConfig,
  ...options
}: IndexerWithStreamConfig<TFilter, TBlock, TRet>) {
  const indexer: Indexer<TFilter, TBlock, TRet> = {
    options,
    streamConfig,
    hooks: createHooks<IndexerHooks<TFilter, TBlock, TRet>>(),
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

export async function run<TFilter, TBlock, TRet>(
  client: Client<TFilter, TBlock>,
  indexer: Indexer<TFilter, TBlock, TRet>,
  sinkArg?: Sink,
) {
  await indexerAsyncContext.callAsync({}, async () => {
    await indexer.hooks.callHook("run:before");

    const sink = sinkArg ?? defaultSink();

    sink.hook("write", async ({ data }) => {
      await indexer.hooks.callHook("sink:write", { data: data as TRet[] });
    });
    sink.hook("flush", async ({ endCursor, finality }) => {
      await indexer.hooks.callHook("sink:flush", { endCursor, finality });
    });

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

    // TODO persistence plugin filter
    await indexer.hooks.callHook("connect:before", { request, options });

    // store main filter, so later it can be merged
    let mainFilter: TFilter;
    if (isFactoryMode) {
      mainFilter = request.filter[1];
    }

    // create stream
    let stream = client.streamData(request, options);

    await indexer.hooks.callHook("connect:after");

    // on state ->
    // normal: iterate as usual
    // recover: reconnect after updating filter
    let state: { _tag: "normal" } | { _tag: "recover"; data?: TRet[] } = {
      _tag: "normal",
    };

    while (true) {
      for await (const message of stream) {
        await indexer.hooks.callHook("message", { message });

        switch (message._tag) {
          case "data": {
            await tracer.startActiveSpan("message data", async (span) => {
              const blocks = message.data.data;
              const { cursor, endCursor, finality } = message.data;

              let block: TBlock | null;

              // combine output of factory and transform function
              const output: TRet[] = [];

              // when factory mode
              if (isFactoryMode) {
                assert(indexer.options.factory !== undefined);

                const [factoryBlock, mainBlock] = blocks;

                block = mainBlock;

                if (state._tag === "normal" && factoryBlock !== null) {
                  const { data, filter } =
                    await indexer.options.factory(factoryBlock);

                  // write returned data from factory function if filter is not defined
                  if (!filter) {
                    output.push(...(data ?? []));
                  } else {
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
                    stream = client.streamData(request, options);

                    // change state to recover mode
                    state = {
                      _tag: "recover",
                      data,
                    };

                    return;
                  }
                }
                // after restart when state in recover mode
                else if (state._tag === "recover") {
                  // we write data to output
                  output.push(...(state.data ?? []));
                  // change state back to normal to avoid infinite loop
                  state = { _tag: "normal" };
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
                    const transformOutput = await indexer.options.transform({
                      block,
                      cursor,
                      endCursor,
                      finality,
                    });

                    // write transformed data to output
                    output.push(...transformOutput);

                    await indexer.hooks.callHook("handler:after", { output });
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

              // if output has data, write it to sink
              if (output.length > 0) {
                await tracer.startActiveSpan("sink write", async (span) => {
                  await sink.write({
                    data: output as SinkData[],
                    cursor,
                    endCursor,
                    finality,
                  });

                  span.end();
                });
              }
              span.end();
            });
            break;
          }
          default: {
            consola.warn("unexpected message", message);
            throw new Error("not implemented");
          }
        }

        // if stream needs a restart
        // break out of the current stream iterator
        if (state._tag !== "normal") {
          break;
        }
      }

      // when restarting stream we continue while loop again
      if (state._tag !== "normal") {
        continue;
      }

      await indexer.hooks.callHook("run:after");

      break;
    }
  });
}
