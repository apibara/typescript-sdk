import consola from "consola";
import { createChannel } from "nice-grpc";
import {
  createHooks,
  createDebugger,
  type NestedHooks,
  type Hookable,
} from "hookable";
import {
  createClient,
  type Cursor,
  type DataFinality,
  type StreamConfig,
} from "@apibara/protocol";

import { indexerAsyncContext } from "./context";
import { type Sink, defaultSink } from "./sink";

export interface IndexerHooks<TFilter, TBlock, TRet> {
  "run:before": () => void;
  "run:after": () => void;
  "connect:before": () => void;
  "connect:after": () => void;
  "handler:before": ({ block }: { block: TBlock }) => void;
  "handler:after": ({ output }: { output: TRet }) => void;
  "sink:write": ({ data }: { data: TRet }) => void;
  "sink:flush": () => void;
}

export interface IndexerConfig<TFilter, TBlock, TRet> {
  streamUrl: string;
  filter: TFilter;
  finality?: DataFinality;
  startingCursor?: Cursor;
  factory?: (block: TBlock) => { filter?: TFilter; data?: TRet };
  transform: (block: TBlock) => TRet;
  sink?: Sink<TRet>;
  hooks?: NestedHooks<IndexerHooks<TFilter, TBlock, TRet>>;
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

  return indexer;
}

export async function run<TFilter, TBlock, TRet>(
  indexer: Indexer<TFilter, TBlock, TRet>,
) {
  await indexerAsyncContext.callAsync({}, async () => {
    await indexer.hooks.callHook("run:before");

    const sink = indexer.options.sink ?? defaultSink();

    sink.on("write", async ({ data }) => {
      await indexer.hooks.callHook("sink:write", { data });
    });
    sink.on("flush", async () => {
      await indexer.hooks.callHook("sink:flush");
    });

    const channel = createChannel(indexer.options.streamUrl);
    const client = createClient(indexer.streamConfig, channel);

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
          const blocks = message.data.data;
          if (blocks.length !== 1) {
            // Ask me about this.
            throw new Error("expected exactly one block");
          }
          const block = blocks[0];
          await indexer.hooks.callHook("handler:before", { block });
          const output = await indexer.options.transform(block);
          await indexer.hooks.callHook("handler:after", { output });
          await sink.write({ data: output });
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