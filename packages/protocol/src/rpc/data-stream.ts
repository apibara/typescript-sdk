import type { StreamDataOptions } from "../client";
import type { Cursor } from "../common";
import type { StreamDataRequest, StreamDataResponse } from "../stream";
import { type ChainTracker, createChainTracker } from "./chain-tracker";
import type { RpcStreamConfig } from "./config";
import { blockInfoToCursor } from "./helpers";

const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;

type State<TFilter, TBlock> = {
  // The network-specific config.
  config: RpcStreamConfig<TFilter, TBlock>;
  // The current cursor, that is the last block that was filtered.
  cursor: Cursor;
  // When the finalized block was last refreshed.
  lastFinalizedRefresh: number;
  // When the head was last refreshed.
  lastHeadRefresh: number;
  // When the last heartbeat was sent.
  lastHeartbeat: number;
  // When the last backfill message was sent.
  lastBackfillMessage: number;
  // The last empty header sent.
  lastEmptyBlockNumber: bigint | undefined;
  // Track the chain's state.
  chainTracker: ChainTracker;
  // Heartbeat interval in milliseconds.
  heartbeatIntervalMs: number;
  // The request filter.
  filter: TFilter;
  // The request options.
  options?: StreamDataOptions;
};

export class RpcDataStream<TFilter, TBlock> {
  private heartbeatIntervalMs: number;

  constructor(
    private config: RpcStreamConfig<TFilter, TBlock>,
    private request: StreamDataRequest<TFilter>,
    private options?: StreamDataOptions,
  ) {
    this.heartbeatIntervalMs = request.heartbeatInterval
      ? Number(request.heartbeatInterval.seconds) * 1000
      : DEFAULT_HEARTBEAT_INTERVAL_MS;
  }

  async *[Symbol.asyncIterator](): AsyncIterator<StreamDataResponse<TBlock>> {
    const startingState = await this.initialize();
    yield* dataStreamLoop(startingState);
  }

  private async initialize(): Promise<State<TFilter, TBlock>> {
    if (this.request.filter.length === 0) {
      throw new Error("Request.filter: empty.");
    }

    if (this.request.filter.length > 1) {
      throw new Error("Request.filter: only one filter is supported.");
    }

    const [head, finalized] = await Promise.all([
      this.config.fetchCursor({ blockTag: "latest" }),
      this.config.fetchCursor({ blockTag: "finalized" }),
    ]);

    if (finalized === null) {
      throw new Error("EvmRpcStream requires a finalized block");
    }

    if (head === null) {
      throw new Error("EvmRpcStream requires a chain with blocks.");
    }

    const chainTracker = createChainTracker({
      head,
      finalized,
      batchSize: 20n,
    });

    let cursor: Cursor;
    if (this.request.startingCursor) {
      cursor = this.request.startingCursor;

      const { canonical, reason, fullCursor } =
        await chainTracker.initializeStartingCursor({
          cursor,
          fetchCursor: (blockNumber) =>
            this.config.fetchCursor({ blockNumber }),
        });

      if (!canonical) {
        throw new Error(`Starting cursor is not canonical: ${reason}`);
      }

      cursor = fullCursor;
    } else {
      cursor = { orderKey: -1n };
    }

    return {
      cursor,
      lastHeartbeat: Date.now(),
      lastFinalizedRefresh: Date.now(),
      lastHeadRefresh: Date.now(),
      lastBackfillMessage: Date.now(),
      lastEmptyBlockNumber: undefined,
      chainTracker,
      config: this.config,
      heartbeatIntervalMs: this.heartbeatIntervalMs,
      filter: this.request.filter[0],
      options: this.options,
    };
  }
}

async function* dataStreamLoop<TFilter, TBlock>(
  state: State<TFilter, TBlock>,
): AsyncGenerator<StreamDataResponse<TBlock>> {
  while (shouldContinue(state)) {
    const { cursor, chainTracker } = state;

    // Always check for heartbeats first to ensure we don't miss any.
    if (shouldSendHeartbeat(state)) {
      state.lastHeartbeat = Date.now();
      yield { _tag: "heartbeat" };
    }

    if (shouldRefreshFinalized(state)) {
      const finalizedInfo = await state.config.fetchCursor({
        blockTag: "finalized",
      });

      if (finalizedInfo === null) {
        throw new Error("Failed to fetch finalized cursor");
      }

      const finalized = blockInfoToCursor(finalizedInfo);
      const finalizedChanged =
        state.chainTracker.updateFinalized(finalizedInfo);

      // Only send finalized if it's needed.
      if (finalizedChanged && state.cursor.orderKey > finalized.orderKey) {
        yield { _tag: "finalize", finalize: { cursor: finalized } };
      }

      state.lastFinalizedRefresh = Date.now();
    }

    const finalized = chainTracker.finalized();

    console.log(
      `[DS] RpcLoop: c=${cursor.orderKey} f=${finalized.orderKey} h=${chainTracker.head().orderKey}`,
    );

    if (cursor.orderKey < finalized.orderKey) {
      yield* backfillFinalizedBlocks(state);
    } else {
      // If we're at the head, wait for a change.
      //
      // We don't want to produce a block immediately, but re-run the loop so
      // that it's like any other iteration.
      if (isAtHead(state)) {
        yield* waitForHeadChange(state);
      } else {
        yield* produceLiveBlocks(state);
      }
    }
  }
}

async function* backfillFinalizedBlocks<TFilter, TBlock>(
  state: State<TFilter, TBlock>,
): AsyncGenerator<StreamDataResponse<TBlock>> {
  const { cursor, chainTracker, config, filter } = state;
  const finalized = chainTracker.finalized();

  // While backfilling we want to regularly send some blocks (even if empty) so
  // that the client can store the cursor.
  const force = shouldForceBackfill(state);

  const filterData = await config.fetchBlockRange({
    startBlock: cursor.orderKey + 1n,
    maxBlock: finalized.orderKey,
    force,
    filter,
  });

  if (filterData.endBlock > finalized.orderKey) {
    throw new Error(
      "Network-specific stream returned invalid data, crossing the finalized block.",
    );
  }

  for (const data of filterData.data) {
    state.lastHeartbeat = Date.now();
    state.lastBackfillMessage = Date.now();
    yield {
      _tag: "data",
      data: {
        cursor: data.cursor,
        endCursor: data.endCursor,
        data: [data.block],
        finality: "finalized",
        production: "backfill",
      },
    };
  }

  // Notice that we check that filteredData.endBlock <= finalized.orderKey above.
  if (filterData.endBlock === finalized.orderKey) {
    // Prepare for transition to non-finalized data.
    state.cursor = finalized;
  } else {
    state.cursor = { orderKey: filterData.endBlock };
  }
}

// This is a generator to possibly produce data for live blocks.
//
// It's a generator because it's not guaranteed to produce data for the next block.
async function* produceLiveBlocks<TFilter, TBlock>(
  state: State<TFilter, TBlock>,
): AsyncGenerator<StreamDataResponse<TBlock>> {
  const { config, cursor, chainTracker, filter } = state;

  if (shouldRefreshHead(state)) {
    const maybeNewHead = await config.fetchCursor({ blockTag: "latest" });
    if (maybeNewHead === null) {
      throw new Error("Failed to fetch the latest block");
    }

    const result = await chainTracker.updateHead({
      newHead: maybeNewHead,
      fetchCursorByHash: (blockHash) => config.fetchCursor({ blockHash }),
      fetchCursorRange: (args) => config.fetchCursorRange(args),
    });

    state.lastHeadRefresh = Date.now();

    if (result.status === "reorg") {
      const { cursor } = result;
      // Only handle reorgs if they involve blocks already processed.
      if (
        cursor.orderKey < state.cursor.orderKey ||
        (state.lastEmptyBlockNumber !== undefined &&
          cursor.orderKey < state.lastEmptyBlockNumber)
      ) {
        state.cursor = cursor;

        yield {
          _tag: "invalidate",
          invalidate: { cursor },
        };

        return;
      }
    }
  }

  const head = chainTracker.head();

  const filterData = await config.fetchBlockRange({
    startBlock: cursor.orderKey + 1n,
    maxBlock: head.orderKey,
    force: false,
    filter,
  });

  if (filterData.data.length === 0 && head.uniqueKey !== undefined) {
    // Send an empty block if we reached the head, but don't update the cursor.
    if (
      state.lastEmptyBlockNumber === undefined ||
      head.orderKey > state.lastEmptyBlockNumber
    ) {
      const { data } = await config.fetchBlockByHash({
        blockHash: head.uniqueKey,
        isAtHead: true,
        filter,
      });

      yield {
        _tag: "data",
        data: {
          cursor: data.cursor,
          endCursor: data.endCursor,
          data: [data.block],
          finality: "accepted",
          production: "live",
        },
      };

      state.lastEmptyBlockNumber = head.orderKey;
    }
  }

  for (const { cursor, endCursor, block } of filterData.data) {
    if (!chainTracker.isCanonical(endCursor)) {
      throw new Error("Trying to process non-canonical block");
    }

    if (block !== null) {
      state.lastHeartbeat = Date.now();
      const production = isAtHead(state) ? "live" : "backfill";

      yield {
        _tag: "data",
        data: {
          cursor,
          endCursor,
          data: [block],
          finality: "accepted",
          production,
        },
      };
    }

    state.cursor = {
      orderKey: endCursor.orderKey,
      uniqueKey: endCursor.uniqueKey,
    };
  }
}

async function* waitForHeadChange<TBlock>(
  state: State<unknown, TBlock>,
): AsyncGenerator<StreamDataResponse<TBlock>> {
  const { chainTracker, config } = state;

  const heartbeatDeadline = state.lastHeartbeat + state.heartbeatIntervalMs;
  const finalizedRefreshDeadline =
    state.lastFinalizedRefresh + config.finalizedRefreshIntervalMs();

  while (true) {
    const now = Date.now();
    // Allow the outer loop to send the heartbeat message or refresh finalized blocks.
    if (now >= heartbeatDeadline || now >= finalizedRefreshDeadline) {
      return;
    }

    const maybeNewHead = await config.fetchCursor({ blockTag: "latest" });

    if (maybeNewHead === null) {
      throw new Error("Failed to fetch the latest block");
    }

    const result = await chainTracker.updateHead({
      newHead: maybeNewHead,
      fetchCursorByHash: (blockHash) => config.fetchCursor({ blockHash }),
      fetchCursorRange: (args) => config.fetchCursorRange(args),
    });

    switch (result.status) {
      case "unchanged": {
        const heartbeatTimeout = heartbeatDeadline - now;
        const finalizedTimeout = finalizedRefreshDeadline - now;

        // Wait until whatever happens next.
        await sleep(
          Math.min(
            heartbeatTimeout,
            finalizedTimeout,
            config.headRefreshIntervalMs(),
          ),
        );

        break;
      }
      case "reorg": {
        const { cursor } = result;
        // Only handle reorgs if they involve blocks already processed.
        if (
          cursor.orderKey < state.cursor.orderKey ||
          (state.lastEmptyBlockNumber !== undefined &&
            cursor.orderKey < state.lastEmptyBlockNumber)
        ) {
          state.cursor = cursor;

          yield {
            _tag: "invalidate",
            invalidate: { cursor },
          };
        }

        break;
      }
      case "success": {
        // Chain grew without any issues. Go back to the top-level loop to produce data.
        return;
      }
    }
  }
}

function shouldSendHeartbeat(state: State<unknown, unknown>): boolean {
  const { heartbeatIntervalMs, lastHeartbeat } = state;
  const now = Date.now();
  return now - lastHeartbeat >= heartbeatIntervalMs;
}

function shouldForceBackfill(state: State<unknown, unknown>): boolean {
  const { lastBackfillMessage, heartbeatIntervalMs } = state;
  const now = Date.now();
  return now - lastBackfillMessage >= heartbeatIntervalMs;
}

function shouldContinue(state: State<unknown, unknown>): boolean {
  const { endingCursor } = state.options || {};
  if (endingCursor === undefined) return true;

  return state.cursor.orderKey < endingCursor.orderKey;
}

function shouldRefreshFinalized(state: State<unknown, unknown>): boolean {
  const { lastFinalizedRefresh, config } = state;
  const now = Date.now();
  return now - lastFinalizedRefresh >= config.finalizedRefreshIntervalMs();
}

function shouldRefreshHead(state: State<unknown, unknown>): boolean {
  const { lastHeadRefresh, config } = state;
  const now = Date.now();
  return now - lastHeadRefresh >= config.headRefreshIntervalMs();
}

function isAtHead(state: State<unknown, unknown>): boolean {
  const head = state.chainTracker.head();
  return state.cursor.orderKey === head.orderKey;
}

function sleep(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}
