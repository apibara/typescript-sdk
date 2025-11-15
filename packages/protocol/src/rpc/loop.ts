import type { StreamDataOptions } from "../client";
import type { Cursor } from "../common";
import type {
  Data,
  Invalidate,
  StreamDataRequest,
  StreamDataResponse,
} from "../stream";
import type { RpcStreamConfig } from "./config";
import type { LoopState } from "./types";

const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;
const DEFAULT_REFRESH_INTERVAL_MS = 5_000;
const DEFAULT_POLL_INTERVAL_MS = 1_000;
const DEFAULT_ERROR_RETRY_MS = 5_000;
const DEFAULT_BATCH_SIZE = 10n;

export class StreamLoop<TFilter, TBlock> {
  private state!: LoopState;
  private request: StreamDataRequest<TFilter>;
  private config: RpcStreamConfig<TFilter, TBlock>;
  private options: StreamDataOptions | undefined;
  private heartbeatIntervalMs: number;

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

    // setup state
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
      // TODO: thiss should start from 0 if no starting cursor is provided and max based on finality
      cursor =
        this.request.finality === "finalized" ? finalizedCursor : headCursor;
    }

    this.state = {
      cursor,
      finalizedCursor,
      headCursor,
      canonicalChain: new Map(),
      lastHeartbeat: Date.now(),
    };

    // if already at or ahead of finalized we dont want to back fill
    if (cursor.orderKey >= finalizedCursor.orderKey) {
      return;
    }

    while (this.state.cursor.orderKey < this.state.finalizedCursor.orderKey) {
      if (this.shouldStop()) return;
      if (this.options?.signal?.aborted) return;

      const startBlock = this.state.cursor.orderKey + 1n;
      let endBlock = this.state.finalizedCursor.orderKey;

      if (endBlock - startBlock + 1n > DEFAULT_BATCH_SIZE) {
        endBlock = startBlock + DEFAULT_BATCH_SIZE - 1n;
      }

      try {
        const blocks = await this.config.fetchFinalizedRange(
          startBlock,
          endBlock,
          this.request.filter,
        );

        // TODO: we should get the end block/cursor from the last block in the range
        const dataMsg: Data<TBlock> = {
          cursor: { orderKey: startBlock },
          endCursor: { orderKey: endBlock },
          finality: "finalized",
          production: "backfill",
          data: blocks,
        };

        yield {
          _tag: "data",
          data: dataMsg,
        };

        this.state.cursor = { orderKey: endBlock };
        this.state.lastHeartbeat = Date.now();
      } catch (error) {
        yield {
          _tag: "systemMessage",
          systemMessage: {
            output: {
              _tag: "stderr",
              stderr: `Backfill error: ${error instanceof Error ? error.message : String(error)}`,
            },
          },
        };
        await this.sleep(DEFAULT_ERROR_RETRY_MS);
      }
    }
  }

  private async *phaseBuildCanonicalChain(): AsyncGenerator<
    StreamDataResponse<TBlock>
  > {
    const [newFinalized, newHead] = await Promise.all([
      this.config.getCursor("finalized"),
      this.config.getCursor("head"),
    ]);

    this.state.finalizedCursor = newFinalized;
    this.state.headCursor = newHead;

    try {
      await this.rebuildCanonicalChain();
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

    // TODO: recheck if really needed
    // this.state.cursor = this.state.finalizedCursor;
  }

  private async *phaseLiveStream(): AsyncGenerator<StreamDataResponse<TBlock>> {
    while (true) {
      if (this.shouldStop()) return;
      if (this.options?.signal?.aborted) return;

      try {
        const whichOne = await Promise.race([
          this.fetchNextBlock().then(() => "data" as const),
          this.waitForHeartbeat().then(() => "heartbeat" as const),
          this.waitForRefresh().then(() => "refresh" as const),
        ]);

        switch (whichOne) {
          case "data": {
            const dataMsg = await this.processNextBlock();
            if (dataMsg) {
              yield dataMsg;
              this.state.lastHeartbeat = Date.now();
            }
            break;
          }

          case "heartbeat": {
            yield {
              _tag: "heartbeat",
            };
            this.state.lastHeartbeat = Date.now();
            break;
          }

          case "refresh": {
            // Update finalized and head, check for changes
            const refreshMessages = await this.refreshChainState();
            for (const msg of refreshMessages) {
              yield msg;
            }
            break;
          }
        }
      } catch (error) {
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

  // we do polling until we get the next block
  private async fetchNextBlock(): Promise<void> {
    const nextBlockNumber = this.state.cursor.orderKey + 1n;

    while (nextBlockNumber > this.state.headCursor.orderKey) {
      await this.sleep(DEFAULT_POLL_INTERVAL_MS);

      const newHead = await this.config.getCursor("head");
      this.state.headCursor = newHead;
    }
  }

  private async processNextBlock(): Promise<StreamDataResponse<TBlock> | null> {
    const nextBlockNumber = this.state.cursor.orderKey + 1n;

    const [blockInfo, blockData] = await Promise.all([
      this.config.getBlockInfo(nextBlockNumber),
      this.config.fetchBlock(nextBlockNumber, this.request.filter),
    ]);

    // for reorg we check if this block's parent exists in our canonical chain
    const parentInChain = this.state.canonicalChain.get(blockInfo.parentHash);

    if (
      !parentInChain &&
      nextBlockNumber > this.state.finalizedCursor.orderKey
    ) {
      // reorg detected
      const invalidateMsg: Invalidate = {
        cursor: this.state.cursor,
      };

      this.state.cursor = this.state.finalizedCursor;
      await this.rebuildCanonicalChain();

      return {
        _tag: "invalidate",
        invalidate: invalidateMsg,
      };
    }

    this.state.canonicalChain.set(blockInfo.blockHash, {
      blockNumber: blockInfo.blockNumber,
      blockHash: blockInfo.blockHash,
      parentHash: blockInfo.parentHash,
    });

    this.pruneCanonicalChain(this.state.finalizedCursor.orderKey);

    const finality =
      blockInfo.blockNumber <= this.state.finalizedCursor.orderKey
        ? "finalized"
        : this.request.finality || "accepted";

    const dataMsg: Data<TBlock> = {
      cursor: this.state.cursor,
      endCursor: {
        orderKey: blockInfo.blockNumber,
        uniqueKey: blockInfo.blockHash,
      },
      finality,
      production: "live",
      data: [blockData],
    };

    this.state.cursor = {
      orderKey: blockInfo.blockNumber,
      uniqueKey: blockInfo.blockHash,
    };

    return {
      _tag: "data",
      data: dataMsg,
    };
  }

  private async refreshChainState(): Promise<StreamDataResponse<TBlock>[]> {
    const messages: StreamDataResponse<TBlock>[] = [];

    const [newFinalized, newHead] = await Promise.all([
      this.config.getCursor("finalized"),
      this.config.getCursor("head"),
    ]);

    // Check if finalized changed
    if (newFinalized.orderKey !== this.state.finalizedCursor.orderKey) {
      this.state.finalizedCursor = newFinalized;

      messages.push({
        _tag: "finalize",
        finalize: {
          cursor: newFinalized,
        },
      });

      this.pruneCanonicalChain(newFinalized.orderKey);
    }

    this.state.headCursor = newHead;

    return messages;
  }

  private async rebuildCanonicalChain(): Promise<void> {
    this.state.canonicalChain.clear();

    const startBlock = this.state.finalizedCursor.orderKey;
    const endBlock = this.state.headCursor.orderKey;

    for (let blockNum = startBlock; blockNum <= endBlock; blockNum++) {
      const blockInfo = await this.config.getBlockInfo(blockNum);
      this.state.canonicalChain.set(blockInfo.blockHash, {
        blockNumber: blockNum,
        blockHash: blockInfo.blockHash,
        parentHash: blockInfo.parentHash,
      });
    }
  }

  private pruneCanonicalChain(beforeBlock: bigint): void {
    for (const [hash, block] of this.state.canonicalChain.entries()) {
      if (block.blockNumber < beforeBlock) {
        this.state.canonicalChain.delete(hash);
      }
    }
  }

  private waitForHeartbeat(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.state.lastHeartbeat;
    const remaining = this.heartbeatIntervalMs - elapsed;

    if (remaining <= 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => setTimeout(resolve, remaining));
  }

  private waitForRefresh(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, DEFAULT_REFRESH_INTERVAL_MS),
    );
  }

  private shouldStop(): boolean {
    const { endingCursor } = this.options || {};
    if (!endingCursor) return false;

    return this.state.cursor.orderKey >= endingCursor.orderKey;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
