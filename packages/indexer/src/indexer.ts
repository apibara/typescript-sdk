import consola from "consola";
import {
  createHooks,
  createDebugger,
  type NestedHooks,
  type Hookable,
} from "hookable";
import type {
  Client,
  Cursor,
  DataFinality,
  StreamConfig,
} from "@apibara/protocol";

import { indexerAsyncContext } from "./context";
import { type Sink, defaultSink } from "./sink";
import type { IndexerPlugin } from "./plugins";
import { tracer } from "./otel";

export interface IndexerHooks<TFilter, TBlock, TRet> {
  "run:before": () => void;
  "run:after": () => void;
  "connect:before": () => void;
  "connect:after": () => void;
  "handler:before": ({ block }: { block: TBlock }) => void;
  "handler:after": ({ output }: { output: TRet[] }) => void;
  "sink:write": ({ data }: { data: TRet[] }) => void;
  "sink:flush": () => void;
}

export interface IndexerConfig<TFilter, TBlock, TRet> {
  streamUrl: string;
  filter: TFilter;
  finality?: DataFinality;
  startingCursor?: Cursor;
  factory?: (block: TBlock) => { filter?: TFilter; data?: TRet[] };
  transform: (args: {
    block: TBlock;
    cursor?: Cursor | undefined;
    endCursor?: Cursor | undefined;
    finality: DataFinality;
  }) => TRet[];
  sink?: Sink<TRet> | Promise<Sink<TRet>>;
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
) {
  await indexerAsyncContext.callAsync({}, async () => {
    await indexer.hooks.callHook("run:before");

    const sink = (await indexer.options.sink) ?? defaultSink();

    sink.on("write", async ({ data }) => {
      await indexer.hooks.callHook("sink:write", { data });
    });
    sink.on("flush", async () => {
      await indexer.hooks.callHook("sink:flush");
    });

    const request = indexer.streamConfig.Request.make({
      filter: [indexer.options.filter],
      finality: indexer.options.finality,
      startingCursor: indexer.options.startingCursor,
    });

    await indexer.hooks.callHook("connect:before");

    const stream = client.streamData(request);

    await indexer.hooks.callHook("connect:after");

    for await (const message of stream) {
      switch (message._tag) {
        case "data": {
          await tracer.startActiveSpan("message data", async (span) => {
            const blocks = message.data.data;
            const { cursor, endCursor, finality } = message.data;
            if (blocks.length !== 1) {
              // Ask me about this.
              throw new Error("expected exactly one block");
            }

            const block = blocks[0];

            const output = await tracer.startActiveSpan(
              "handler",
              async (span) => {
                await indexer.hooks.callHook("handler:before", { block });
                const output = await indexer.options.transform({
                  block,
                  cursor,
                  endCursor,
                  finality,
                });
                await indexer.hooks.callHook("handler:after", { output });

                span.end();
                return output;
              },
            );

            await tracer.startActiveSpan("sink write", async (span) => {
              await sink.write({ data: output, cursor, endCursor, finality });

              span.end();
            });

            span.end();
          });
          break;
        }
        default: {
          consola.warn("unexpected message", message);
          throw new Error("not implemented");
        }
      }
    }

    await indexer.hooks.callHook("run:after");
  });
}
