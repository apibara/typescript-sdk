import { backfillEvents } from "./backfill";
import { StarknetBlockCache } from "./block-cache";
import { DEFAULT_SUBSCRIPTION_FINALITY_STATUS } from "./constants";
import {
  compareEventCursor,
  cursorBeforeBlock,
  eventCursorKey,
  eventVersionKey,
  isCursorBeforeBlock,
} from "./cursor";
import { StarknetTransportError } from "./http";
import { subscribeEvents } from "./subscribe";
import type {
  BlockId,
  EventCursor,
  EventSubscription,
  ReorgMessage,
  StreamEventsOptions,
  StreamMessage,
} from "./types";
import { TooManyBlocksBackError } from "./ws";

const DEFAULT_HTTP_RETRY_DELAY_MS = 500;
const MAX_HTTP_RETRY_DELAY_MS = 10_000;
const ZERO_FELT = `0x${"0".repeat(64)}`;

export async function* streamEvents(
  options: StreamEventsOptions,
): AsyncGenerator<StreamMessage> {
  rejectUnsupportedOptions(options);

  const blockCache = new StarknetBlockCache({
    url: options.url,
    signal: options.signal,
  });

  let lastYieldedCursor = options.cursor;
  let lastRealCursor = isRollbackCursor(options.cursor)
    ? undefined
    : options.cursor;
  let backfillFromBlock = options.fromBlock;
  let backfillCursor = options.cursor;
  let lastBackfilledBlockNumber = options.cursor?.blockNumber;
  let httpRetryAttempt = 0;
  let subscription: EventSubscription | undefined;
  let initialCursorRollbackPending = shouldReplayInitialCursorBlock(options);
  const seenEvents = new RememberedEventVersions(2_048);

  try {
    while (true) {
      throwIfAborted(options.signal);

      let headBlockId: BlockId;

      try {
        const head = await blockCache.getLatestBlock();
        headBlockId = { block_number: head.blockNumber };
        const cursorForBackfill = backfillCursor;
        const initialRollbackCursor =
          initialCursorRollbackPending && cursorForBackfill !== undefined
            ? cursorForBackfill
            : undefined;
        const cursorPastAcceptedHead =
          initialRollbackCursor !== undefined
            ? initialRollbackCursor.blockNumber > head.blockNumber
            : cursorForBackfill !== undefined &&
              cursorForBackfill.blockNumber > head.blockNumber;
        const shouldRollbackCursorBlock =
          initialRollbackCursor !== undefined || cursorPastAcceptedHead;

        let skipBackfill = false;

        if (shouldRollbackCursorBlock && cursorForBackfill !== undefined) {
          initialCursorRollbackPending = false;
          const startingBlockNumber = cursorPastAcceptedHead
            ? head.blockNumber + 1
            : cursorForBackfill.blockNumber;
          const endingBlockNumber = cursorForBackfill.blockNumber;
          const rollbackCursor = cursorBeforeBlock(startingBlockNumber);
          const shouldEmitRollback =
            !isRollbackCursor(cursorForBackfill) ||
            cursorForBackfill.blockNumber > startingBlockNumber;

          lastYieldedCursor = rollbackCursor;
          lastRealCursor = undefined;
          backfillFromBlock = { block_number: startingBlockNumber };
          backfillCursor = undefined;
          lastBackfilledBlockNumber = head.blockNumber;
          blockCache.invalidateFrom(startingBlockNumber);
          httpRetryAttempt = 0;
          skipBackfill = startingBlockNumber > head.blockNumber;

          if (shouldEmitRollback) {
            yield syntheticReorgMessage(startingBlockNumber, endingBlockNumber);
          }
        } else {
          initialCursorRollbackPending = false;
        }

        if (!skipBackfill && isBlockNumberId(backfillFromBlock)) {
          skipBackfill = backfillFromBlock.block_number > head.blockNumber;
        }

        if (!skipBackfill) {
          for await (const message of backfillEvents({
            url: options.url,
            fromBlock: backfillFromBlock,
            toBlock: headBlockId,
            addresses: options.addresses,
            keys: options.keys,
            chunkSize: options.chunkSize,
            cursor: backfillCursor,
            signal: options.signal,
          })) {
            if (message.type === "event") {
              if (!shouldYieldEvent(message.cursor, lastYieldedCursor)) {
                continue;
              }

              lastYieldedCursor = message.cursor;
              lastRealCursor = message.cursor;
              seenEvents.remember(
                eventCursorKey(message.cursor),
                eventVersionKey(message.event),
              );
            }

            yield message;
          }

          lastBackfilledBlockNumber = head.blockNumber;
          httpRetryAttempt = 0;
        } else {
          lastBackfilledBlockNumber = head.blockNumber;
        }
      } catch (error) {
        if (!isRetryableHttpError(error, options.signal)) {
          throw error;
        }

        if (lastRealCursor) {
          backfillCursor = lastRealCursor;
        }

        httpRetryAttempt += 1;
        await waitForStreamRetry(
          retryDelayMs(httpRetryAttempt),
          options.signal,
        );
        continue;
      }

      throwIfAborted(options.signal);

      backfillFromBlock = headBlockId;
      backfillCursor = undefined;

      subscription = subscribeEvents({
        url: options.wsUrl,
        blockId: headBlockId,
        addresses: options.addresses,
        keys: options.keys,
        finalityStatus: options.finalityStatus,
        cursor: lastRealCursor,
        signal: options.signal,
        idleTimeoutMs: options.idleTimeoutMs,
        maxQueueSize: options.maxQueueSize,
        webSocketFactory: options.webSocketFactory,
      });

      const subscriptionState = {
        lastYieldedCursor,
        lastRealCursor,
        seenEvents,
      };
      let reorg: ReorgMessage | undefined;

      try {
        reorg = yield* yieldFromSubscription(subscription, subscriptionState);
        lastYieldedCursor = subscriptionState.lastYieldedCursor;
        lastRealCursor = subscriptionState.lastRealCursor;
        subscription = undefined;
      } catch (error) {
        lastYieldedCursor = subscriptionState.lastYieldedCursor;
        lastRealCursor = subscriptionState.lastRealCursor;

        if (!(error instanceof TooManyBlocksBackError)) {
          throw error;
        }

        if (subscription) {
          await subscription.unsubscribe();
        }
        subscription = undefined;

        const resumeBlockNumber = Math.max(
          lastBackfilledBlockNumber ?? 0,
          lastRealCursor?.blockNumber ?? 0,
        );
        backfillFromBlock = { block_number: resumeBlockNumber };
        backfillCursor =
          lastRealCursor && lastRealCursor.blockNumber >= resumeBlockNumber
            ? lastRealCursor
            : undefined;
        continue;
      }

      if (!reorg) {
        return;
      }

      const startingBlockNumber = reorg.reorg.startingBlockNumber;
      const rollbackCursor =
        reorg.rollbackCursor ?? cursorBeforeBlock(startingBlockNumber);
      const rollbackMessage: ReorgMessage = {
        ...reorg,
        rollbackCursor,
      };
      blockCache.invalidateFrom(startingBlockNumber);
      seenEvents.clear();
      lastYieldedCursor = rollbackCursor;
      lastRealCursor = undefined;
      lastBackfilledBlockNumber = undefined;
      backfillFromBlock = { block_number: startingBlockNumber };
      backfillCursor = undefined;

      yield rollbackMessage;
    }
  } finally {
    if (subscription) {
      await subscription.unsubscribe();
    }
  }
}

async function* yieldFromSubscription(
  subscription: EventSubscription,
  state: {
    lastYieldedCursor: EventCursor | undefined;
    lastRealCursor: EventCursor | undefined;
    seenEvents: RememberedEventVersions;
  },
): AsyncGenerator<StreamMessage, ReorgMessage | undefined> {
  for await (const message of subscription) {
    if (message.type === "reorg") {
      await subscription.unsubscribe();
      return message;
    }

    const key = eventCursorKey(message.cursor);
    const version = eventVersionKey(message.event);
    if (
      !shouldYieldEventVersion(
        message.cursor,
        key,
        version,
        state.lastYieldedCursor,
        state.seenEvents,
      )
    ) {
      continue;
    }

    state.lastYieldedCursor = message.cursor;
    state.lastRealCursor = message.cursor;
    state.seenEvents.remember(key, version);
    yield message;
  }

  return undefined;
}

function shouldYieldEvent(
  cursor: EventCursor,
  lastYieldedCursor: EventCursor | undefined,
): boolean {
  return (
    lastYieldedCursor === undefined ||
    compareEventCursor(cursor, lastYieldedCursor) > 0
  );
}

function shouldYieldEventVersion(
  cursor: EventCursor,
  key: string,
  version: string,
  lastYieldedCursor: EventCursor | undefined,
  seenEvents: RememberedEventVersions,
): boolean {
  if (seenEvents.has(key, version)) {
    return false;
  }

  return (
    lastYieldedCursor === undefined ||
    compareEventCursor(cursor, lastYieldedCursor) >= 0
  );
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw signal.reason ?? new Error("The operation was aborted.");
  }
}

function isRollbackCursor(cursor: EventCursor | undefined): boolean {
  return cursor !== undefined && isCursorBeforeBlock(cursor);
}

function isBlockNumberId(
  blockId: BlockId | undefined,
): blockId is { block_number: number } {
  return (
    typeof blockId === "object" && blockId !== null && "block_number" in blockId
  );
}

function shouldReplayInitialCursorBlock(options: StreamEventsOptions): boolean {
  if (!options.cursor || isRollbackCursor(options.cursor)) {
    return false;
  }

  const cursorFinalityStatus = options.cursorFinalityStatus;
  if (
    cursorFinalityStatus === "ACCEPTED_ON_L2" ||
    cursorFinalityStatus === "ACCEPTED_ON_L1"
  ) {
    return false;
  }

  return (
    cursorFinalityStatus === "PRE_CONFIRMED" ||
    (options.finalityStatus ?? DEFAULT_SUBSCRIPTION_FINALITY_STATUS) ===
      "PRE_CONFIRMED"
  );
}

function syntheticReorgMessage(
  startingBlockNumber: number,
  endingBlockNumber: number,
): ReorgMessage {
  const raw = {
    starting_block_number: startingBlockNumber,
    starting_block_hash: "0x0",
    ending_block_number: endingBlockNumber,
    ending_block_hash: "0x0",
  };

  return {
    type: "reorg",
    reorg: {
      startingBlockNumber,
      startingBlockHash: ZERO_FELT,
      endingBlockNumber,
      endingBlockHash: ZERO_FELT,
      synthetic: true,
      raw,
    },
    rollbackCursor: cursorBeforeBlock(startingBlockNumber),
  };
}

class RememberedEventVersions {
  private readonly versions = new Map<string, Set<string>>();
  private readonly order: string[] = [];

  constructor(private readonly maxSize: number) {}

  has(key: string, version: string): boolean {
    return this.versions.get(key)?.has(version) ?? false;
  }

  remember(key: string, version: string): void {
    const versions = this.versions.get(key) ?? new Set<string>();
    if (versions.has(version)) {
      return;
    }

    versions.add(version);
    this.versions.set(key, versions);
    this.order.push(`${key}\0${version}`);

    while (this.order.length > this.maxSize) {
      const oldest = this.order.shift();
      if (!oldest) {
        continue;
      }

      const [oldestKey, oldestVersion] = oldest.split("\0", 2);
      const oldestVersions = this.versions.get(oldestKey);
      oldestVersions?.delete(oldestVersion);
      if (oldestVersions?.size === 0) {
        this.versions.delete(oldestKey);
      }
    }
  }

  clear(): void {
    this.versions.clear();
    this.order.length = 0;
  }
}

function rejectUnsupportedOptions(options: StreamEventsOptions): void {
  if ((options as { toBlock?: unknown }).toBlock !== undefined) {
    throw new Error(
      "streamEvents does not support toBlock. Use backfillEvents for bounded historical indexing.",
    );
  }
}

function isRetryableHttpError(
  error: unknown,
  signal: AbortSignal | undefined,
): boolean {
  return !signal?.aborted && error instanceof StarknetTransportError;
}

function retryDelayMs(attempt: number): number {
  const exponentialDelay =
    DEFAULT_HTTP_RETRY_DELAY_MS * 2 ** Math.max(0, attempt - 1);
  const boundedDelay = Math.min(exponentialDelay, MAX_HTTP_RETRY_DELAY_MS);
  const jitter = Math.random() * boundedDelay * 0.2;

  return Math.min(MAX_HTTP_RETRY_DELAY_MS, Math.round(boundedDelay + jitter));
}

async function waitForStreamRetry(
  delayMs: number,
  signal: AbortSignal | undefined,
): Promise<void> {
  if (signal?.aborted || delayMs <= 0) {
    return;
  }

  await new Promise<void>((resolve) => {
    const onAbort = () => {
      clearTimeout(timeout);
      signal?.removeEventListener?.("abort", onAbort);
      resolve();
    };

    const timeout = setTimeout(() => {
      signal?.removeEventListener?.("abort", onAbort);
      resolve();
    }, delayMs);

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
