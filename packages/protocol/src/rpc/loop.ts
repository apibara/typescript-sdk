import type { StreamDataOptions } from "../client";
import type { Cursor } from "../common";
import type {
  Data,
  DataFinality,
  StreamDataRequest,
  StreamDataResponse,
} from "../stream";
import type { RpcStreamConfig } from "./config";
import type { BlockInfo, CanonicalChain, LoopState } from "./types";

const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;
const DEFAULT_REFRESH_INTERVAL_MS = 5_000;
const DEFAULT_POLL_INTERVAL_MS = 1_000;
const DEFAULT_ERROR_RETRY_MS = 5_000;

export class StreamLoop<TFilter, TBlock> {
  private state: LoopState | null = null;
  private request: StreamDataRequest<TFilter>;
  private config: RpcStreamConfig<TFilter, TBlock>;
  private options: StreamDataOptions | undefined;
  private heartbeatIntervalMs: number;
  private abortController: AbortController | null = null;

  constructor(
    config: RpcStreamConfig<TFilter, TBlock>,
    request: StreamDataRequest<TFilter>,
    options?: StreamDataOptions,
  ) {
    this.config = config;
    this.request = request;
    this.options = options;

    this.heartbeatIntervalMs = request.heartbeatInterval
      ? Number(request.heartbeatInterval.seconds) * 1000 +
        request.heartbeatInterval.nanos / 1_000_000
      : DEFAULT_HEARTBEAT_INTERVAL_MS;
  }

  async *[Symbol.asyncIterator](): AsyncIterator<StreamDataResponse<TBlock>> {
    yield* this.phaseBackfill();
    yield* this.phaseBuildCanonicalChain();
    yield* this.phaseLiveStream();
  }

  private async *phaseBackfill(): AsyncGenerator<StreamDataResponse<TBlock>> {
    const [headCursor, finalizedCursor] = await Promise.all([
      this.config.getCursor("head"),
      this.config.getCursor("finalized"),
    ]);

    let cursor: Cursor;
    if (this.request.startingCursor) {
      cursor = this.request.startingCursor;

      if (cursor.uniqueKey) {
        const valid = await this.config.verifyBlock(
          cursor.orderKey,
          cursor.uniqueKey,
        );
        if (!valid) {
          throw new Error(
            `Starting block at ${cursor.orderKey} does not match hash ${cursor.uniqueKey}`,
          );
        }
      }
    } else {
      cursor = { orderKey: -1n };
    }

    this.state = {
      cursor,
      finalizedCursor,
      headCursor,
      canonicalChain: new Map(),
      lastHeartbeat: Date.now(),
      blockNumberToHash: new Map(),
    };

    yield* this.backfillToTarget(finalizedCursor.orderKey, "backfill");
  }

  private async *phaseBuildCanonicalChain(): AsyncGenerator<
    StreamDataResponse<TBlock>
  > {
    const state = this.ensureState();
    // finalized may have advanced during Phase 1
    const [newFinalized, newHead] = await Promise.all([
      this.config.getCursor("finalized"),
      this.config.getCursor("head"),
    ]);

    state.finalizedCursor = newFinalized;
    state.headCursor = newHead;

    if (state.cursor.orderKey < newFinalized.orderKey) {
      yield* this.backfillToTarget(newFinalized.orderKey, "catch-up");
    }

    try {
      const abortController = new AbortController();
      const chainMap = await this.computeCanonicalChain(
        newFinalized.orderKey,
        newHead.orderKey,
        abortController.signal,
      );
      state.canonicalChain = chainMap;
    } catch (error) {
      yield {
        _tag: "systemMessage",
        systemMessage: {
          output: {
            _tag: "stderr",
            stderr: `Failed to build canonical chain: ${error instanceof Error ? error.message : String(error)}`,
          },
        },
      };
      throw error;
    }
  }

  private async *phaseLiveStream(): AsyncGenerator<StreamDataResponse<TBlock>> {
    const state = this.ensureState();
    while (true) {
      if (this.shouldStop()) return;
      if (this.options?.signal?.aborted) return;

      this.abortController = new AbortController();
      const signal = this.abortController.signal;

      try {
        const result = await Promise.race([
          this.computeNextBlock(signal),
          this.computeHeartbeat(signal),
          this.computeRefresh(signal),
        ]);

        this.abortController.abort();
        this.abortController = null;

        switch (result.type) {
          case "block_data": {
            const { blockInfo, blockData, newHead, newFinalized } = result;

            if (newHead) {
              state.headCursor = newHead;
            }

            if (newFinalized) {
              state.finalizedCursor = newFinalized;
            }

            const parentInChain = state.canonicalChain.get(
              blockInfo.parentHash,
            );

            if (
              !parentInChain &&
              blockInfo.blockNumber > state.finalizedCursor.orderKey
            ) {
              const commonAncestor = await this.findCommonAncestor(blockInfo);

              yield {
                _tag: "invalidate",
                invalidate: { cursor: commonAncestor },
              };

              state.cursor = commonAncestor;

              const rebuildController = new AbortController();
              const chainMap = await this.computeCanonicalChain(
                commonAncestor.orderKey,
                state.headCursor.orderKey,
                rebuildController.signal,
              );
              state.canonicalChain = chainMap;
              continue;
            }

            state.canonicalChain.set(blockInfo.blockHash, blockInfo);
            state.blockNumberToHash.set(
              blockInfo.blockNumber,
              blockInfo.blockHash,
            );

            const previousCursor = state.cursor;

            state.cursor = {
              orderKey: blockInfo.blockNumber,
              uniqueKey: blockInfo.blockHash,
            };

            const finality = this.determineFinality(blockInfo.blockNumber);

            yield {
              _tag: "data",
              data: {
                cursor: previousCursor,
                endCursor: state.cursor,
                finality,
                production: "live",
                data: [blockData],
              },
            };

            state.lastHeartbeat = Date.now();
            break;
          }

          case "heartbeat": {
            yield {
              _tag: "heartbeat",
            };
            state.lastHeartbeat = Date.now();
            break;
          }

          case "refresh": {
            const { newFinalized, newHead } = result;

            state.headCursor = newHead;

            if (newFinalized.orderKey !== state.finalizedCursor.orderKey) {
              state.finalizedCursor = newFinalized;

              yield {
                _tag: "finalize",
                finalize: { cursor: newFinalized },
              };

              this.pruneCanonicalChain(newFinalized.orderKey);
            }
            break;
          }
        }
      } catch (error) {
        if (this.abortController) {
          this.abortController.abort();
          this.abortController = null;
        }

        if (error instanceof Error && error.message === "AbortError") {
          continue;
        }

        yield {
          _tag: "systemMessage",
          systemMessage: {
            output: {
              _tag: "stderr",
              stderr: `Stream error: ${error instanceof Error ? error.message : String(error)}`,
            },
          },
        };
        await this.sleep(DEFAULT_ERROR_RETRY_MS);
      }
    }
  }

  private async computeNextBlock(signal: AbortSignal): Promise<{
    type: "block_data";
    blockInfo: BlockInfo;
    blockData: TBlock | null;
    newHead: Cursor | null;
    newFinalized: Cursor | null;
  }> {
    const state = this.ensureState();
    const nextBlockNumber = state.cursor.orderKey + 1n;
    const requestedFinality = this.request.finality || "accepted";
    let newHead: Cursor | null = null;
    let newFinalized: Cursor | null = null;

    if (requestedFinality === "finalized") {
      // wait for finalized block
      while (nextBlockNumber > state.finalizedCursor.orderKey) {
        if (signal.aborted) throw new Error("AbortError");
        await this.sleep(DEFAULT_POLL_INTERVAL_MS);
        newFinalized = await this.config.getCursor("finalized");
        if (signal.aborted) throw new Error("AbortError");
        if (newFinalized.orderKey >= nextBlockNumber) {
          break;
        }
      }
    } else {
      // wait for head block
      while (nextBlockNumber > state.headCursor.orderKey) {
        if (signal.aborted) throw new Error("AbortError");
        await this.sleep(DEFAULT_POLL_INTERVAL_MS);
        if (signal.aborted) throw new Error("AbortError");
        newHead = await this.config.getCursor("head");
        if (newHead.orderKey >= nextBlockNumber) {
          break;
        }
      }
    }

    if (signal.aborted) throw new Error("AbortError");

    const [blockInfo, blockData] = await Promise.all([
      this.config.getBlockInfo(nextBlockNumber),
      this.config.fetchBlock(nextBlockNumber, this.request.filter),
    ]);

    if (signal.aborted) throw new Error("AbortError");

    return {
      type: "block_data",
      blockInfo,
      blockData,
      newHead,
      newFinalized,
    };
  }

  private async computeHeartbeat(
    signal: AbortSignal,
  ): Promise<{ type: "heartbeat" }> {
    const now = Date.now();
    const state = this.ensureState();
    const elapsed = now - state.lastHeartbeat;
    const remaining = this.heartbeatIntervalMs - elapsed;

    if (remaining > 0) {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, remaining);
        signal.addEventListener("abort", () => clearTimeout(timeout));
      });
    }

    if (signal.aborted) throw new Error("AbortError");

    return { type: "heartbeat" };
  }

  private async computeRefresh(signal: AbortSignal): Promise<{
    type: "refresh";
    newFinalized: Cursor;
    newHead: Cursor;
  }> {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, DEFAULT_REFRESH_INTERVAL_MS);
      signal.addEventListener("abort", () => clearTimeout(timeout));
    });

    if (signal.aborted) throw new Error("AbortError");

    const [newFinalized, newHead] = await Promise.all([
      this.config.getCursor("finalized"),
      this.config.getCursor("head"),
    ]);

    if (signal.aborted) throw new Error("AbortError");

    return {
      type: "refresh",
      newFinalized,
      newHead,
    };
  }

  private async computeCanonicalChain(
    startBlock: bigint,
    endBlock: bigint,
    signal: AbortSignal,
  ): Promise<CanonicalChain> {
    const state = this.ensureState();
    const chainMap: CanonicalChain = new Map();

    for (let blockNum = startBlock; blockNum <= endBlock; blockNum++) {
      if (signal.aborted) throw new Error("AbortError");
      const blockInfo = await this.config.getBlockInfo(blockNum);
      chainMap.set(blockInfo.blockHash, blockInfo);
      state.blockNumberToHash.set(blockInfo.blockNumber, blockInfo.blockHash);
    }

    return chainMap;
  }

  private pruneCanonicalChain(beforeBlock: bigint): void {
    const state = this.ensureState();
    const toDelete: bigint[] = [];

    for (const [blockNum] of state.blockNumberToHash.entries()) {
      if (blockNum < beforeBlock) {
        toDelete.push(blockNum);
      }
    }

    for (const blockNum of toDelete) {
      const hash = state.blockNumberToHash.get(blockNum);
      if (hash) {
        state.canonicalChain.delete(hash);
        state.blockNumberToHash.delete(blockNum);
      }
    }
  }

  private async findCommonAncestor(reorgedBlock: BlockInfo): Promise<Cursor> {
    const state = this.ensureState();
    const parentBlock = state.canonicalChain.get(reorgedBlock.parentHash);

    if (parentBlock) {
      return {
        orderKey: parentBlock.blockNumber,
        uniqueKey: parentBlock.blockHash,
      };
    }

    let currentBlockNum = reorgedBlock.blockNumber - 1n;

    while (currentBlockNum >= state.finalizedCursor.orderKey) {
      const blockHash = state.blockNumberToHash.get(currentBlockNum);
      const blockInChain = blockHash
        ? state.canonicalChain.get(blockHash)
        : undefined;

      if (blockInChain) {
        const isValid = await this.config.verifyBlock(
          blockInChain.blockNumber,
          blockInChain.blockHash,
        );

        if (isValid) {
          return {
            orderKey: blockInChain.blockNumber,
            uniqueKey: blockInChain.blockHash,
          };
        }
      }

      currentBlockNum--;
    }

    return state.finalizedCursor;
  }

  private determineFinality(blockNumber: bigint): DataFinality {
    const state = this.ensureState();
    if (blockNumber <= state.finalizedCursor.orderKey) {
      return "finalized";
    }

    return "accepted";
  }

  private async *backfillToTarget(
    target: bigint,
    reason: "backfill" | "catch-up",
  ): AsyncGenerator<StreamDataResponse<TBlock>> {
    const state = this.ensureState();

    while (state.cursor.orderKey < target) {
      if (this.shouldStop()) return;
      if (this.options?.signal?.aborted) return;

      const startBlock = state.cursor.orderKey + 1n;
      const endBlock = target;

      try {
        const result = await this.config.fetchFinalizedRange(
          startBlock,
          endBlock,
          this.request.filter,
        );

        const dataMsg: Data<TBlock> = {
          cursor: result.startCursor,
          endCursor: result.endCursor,
          finality: "finalized",
          production: reason === "backfill" ? "backfill" : "live",
          data: result.blocks,
        };

        yield {
          _tag: "data",
          data: dataMsg,
        };

        state.cursor = result.endCursor;
        state.lastHeartbeat = Date.now();

        // returned fewer blocks than requested. Continue fetching.
        if (state.cursor.orderKey < target) {
          continue;
        }

        break;
      } catch (error) {
        yield {
          _tag: "systemMessage",
          systemMessage: {
            output: {
              _tag: "stderr",
              stderr: `${reason === "backfill" ? "Backfill" : "Catch-up"} error: ${error instanceof Error ? error.message : String(error)}`,
            },
          },
        };
        await this.sleep(DEFAULT_ERROR_RETRY_MS);
      }
    }
  }

  private shouldStop(): boolean {
    const state = this.ensureState();
    const { endingCursor } = this.options || {};
    if (!endingCursor) return false;

    return state.cursor.orderKey >= endingCursor.orderKey;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private ensureState(): LoopState {
    if (!this.state) {
      throw new Error(
        "StreamLoop not initialized. Must iterate before accessing state.",
      );
    }
    return this.state;
  }
}
