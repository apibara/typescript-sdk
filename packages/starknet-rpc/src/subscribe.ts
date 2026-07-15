import { DEFAULT_SUBSCRIPTION_FINALITY_STATUS } from "./constants";
import { compareEventCursor, eventCursorKey, eventVersionKey } from "./cursor";
import { StarknetEventCursorError, normalizeFelt } from "./normalize";
import type {
  EventCursor,
  EventSubscription,
  Felt,
  StreamMessage,
  SubscribeEventsOptions,
  SubscriptionBlockId,
} from "./types";
import { TooManyBlocksBackError, connectSubscribeEvents } from "./ws";

const DEFAULT_MIN_RECONNECT_DELAY_MS = 500;
const DEFAULT_MAX_RECONNECT_DELAY_MS = 10_000;
const MAX_REMEMBERED_CURSOR_KEYS = 2_048;

type ReconnectConfig = {
  enabled: boolean;
  minDelayMs: number;
  maxDelayMs: number;
  maxAttempts?: number;
};

export function subscribeEvents(
  options: SubscribeEventsOptions,
): EventSubscription {
  const controller = new AbortController();
  let unsubscribed = false;

  const abortFromParent = () => {
    unsubscribed = true;
    controller.abort(options.signal?.reason);
  };

  if (options.signal?.aborted) {
    abortFromParent();
  } else {
    options.signal?.addEventListener("abort", abortFromParent, {
      once: true,
    });
  }

  const subscription: EventSubscription = {
    async unsubscribe() {
      if (unsubscribed) {
        return;
      }

      unsubscribed = true;
      options.signal?.removeEventListener?.("abort", abortFromParent);
      controller.abort(new Error("Subscription unsubscribed"));
    },

    async *[Symbol.asyncIterator]() {
      try {
        yield* subscribeWithReconnect({
          options: normalizeSubscribeOptions(options),
          signal: controller.signal,
          isUnsubscribed: () => unsubscribed,
        });
      } finally {
        unsubscribed = true;
        options.signal?.removeEventListener?.("abort", abortFromParent);
        controller.abort(new Error("Subscription iterator closed"));
      }
    },
  };

  return subscription;
}

async function* subscribeWithReconnect({
  options,
  signal,
  isUnsubscribed,
}: {
  options: SubscribeEventsOptions;
  signal: AbortSignal;
  isUnsubscribed: () => boolean;
}): AsyncGenerator<StreamMessage> {
  const reconnect = normalizeReconnectConfig(options.reconnect);
  const seenEvents = new RememberedEventVersions(MAX_REMEMBERED_CURSOR_KEYS);
  let lastCursor = options.cursor;
  let blockId = initialBlockId(options);
  let attempt = 0;
  let lastError: unknown;

  while (!signal.aborted && !isUnsubscribed()) {
    let yieldedMessage = false;
    lastError = undefined;

    try {
      for await (const message of connectSubscribeEvents({
        ...options,
        blockId,
        cursor: undefined,
        reconnect: undefined,
        signal,
      })) {
        if (message.type === "reorg") {
          if (
            lastCursor &&
            lastCursor.blockNumber >= message.reorg.startingBlockNumber
          ) {
            lastCursor = undefined;
            seenEvents.clear();
          }

          blockId = { block_number: message.reorg.startingBlockNumber };
          yieldedMessage = true;
          yield message;
          continue;
        }

        const key = eventCursorKey(message.cursor);
        const version = eventVersionKey(message.event);
        if (
          shouldSkipEvent(message.cursor, key, version, lastCursor, seenEvents)
        ) {
          continue;
        }

        lastCursor = message.cursor;
        blockId = { block_number: message.cursor.blockNumber };
        seenEvents.remember(key, version);
        yieldedMessage = true;
        yield message;
      }
    } catch (error) {
      if (signal.aborted || isUnsubscribed()) {
        return;
      }

      if (error instanceof TooManyBlocksBackError) {
        throw error;
      }

      if (error instanceof StarknetEventCursorError) {
        throw error;
      }

      if (!reconnect.enabled) {
        throw error;
      }

      lastError = error;
    }

    if (signal.aborted || isUnsubscribed()) {
      return;
    }

    if (!reconnect.enabled) {
      return;
    }

    attempt = yieldedMessage ? 1 : attempt + 1;
    if (
      reconnect.maxAttempts !== undefined &&
      attempt > reconnect.maxAttempts
    ) {
      throw reconnectAttemptsExceededError(reconnect.maxAttempts, lastError);
    }

    await waitForReconnect(reconnectDelayMs(reconnect, attempt), signal);
  }
}

function normalizeSubscribeOptions(
  options: SubscribeEventsOptions,
): SubscribeEventsOptions {
  return {
    ...options,
    blockId: options.blockId ? normalizeBlockId(options.blockId) : undefined,
    addresses: normalizeFelts(options.addresses),
    keys: options.keys?.map((keys) => normalizeFelts(keys) ?? []),
    finalityStatus:
      options.finalityStatus ?? DEFAULT_SUBSCRIPTION_FINALITY_STATUS,
  };
}

function initialBlockId(options: SubscribeEventsOptions): SubscriptionBlockId {
  if (options.blockId) {
    return options.blockId;
  }

  if (options.cursor) {
    return { block_number: options.cursor.blockNumber };
  }

  return "latest";
}

function normalizeBlockId(blockId: SubscriptionBlockId): SubscriptionBlockId {
  if (typeof blockId === "string") {
    if (blockId !== "latest") {
      throw new Error(
        `Invalid starknet_subscribeEvents blockId tag "${blockId}". Use "latest", block_number, or block_hash.`,
      );
    }

    return "latest";
  }

  if ("block_hash" in blockId) {
    return { block_hash: normalizeFelt(blockId.block_hash) };
  }

  return blockId;
}

function normalizeFelts(values?: Felt[]): Felt[] | undefined {
  if (!values) {
    return undefined;
  }

  return Array.from(
    new Set(values.map((value) => normalizeFelt(value, "subscription.filter"))),
  );
}

function shouldSkipEvent(
  cursor: EventCursor,
  key: string,
  version: string,
  lastCursor: EventCursor | undefined,
  seenEvents: RememberedEventVersions,
): boolean {
  if (seenEvents.has(key, version)) {
    return true;
  }

  if (!lastCursor) {
    return false;
  }

  return compareEventCursor(cursor, lastCursor) < 0;
}

function normalizeReconnectConfig(
  reconnect: SubscribeEventsOptions["reconnect"],
): ReconnectConfig {
  if (reconnect === false) {
    return {
      enabled: false,
      minDelayMs: DEFAULT_MIN_RECONNECT_DELAY_MS,
      maxDelayMs: DEFAULT_MAX_RECONNECT_DELAY_MS,
      maxAttempts: undefined,
    };
  }

  if (typeof reconnect === "object" && reconnect.enabled === false) {
    return {
      enabled: false,
      minDelayMs: DEFAULT_MIN_RECONNECT_DELAY_MS,
      maxDelayMs: DEFAULT_MAX_RECONNECT_DELAY_MS,
      maxAttempts: undefined,
    };
  }

  const minDelayMs =
    typeof reconnect === "object" && reconnect.minDelayMs !== undefined
      ? Math.max(0, reconnect.minDelayMs)
      : DEFAULT_MIN_RECONNECT_DELAY_MS;
  const maxDelayMs =
    typeof reconnect === "object" && reconnect.maxDelayMs !== undefined
      ? Math.max(minDelayMs, reconnect.maxDelayMs)
      : DEFAULT_MAX_RECONNECT_DELAY_MS;
  const maxAttempts =
    typeof reconnect === "object" && reconnect.maxAttempts !== undefined
      ? normalizeMaxAttempts(reconnect.maxAttempts)
      : undefined;

  return {
    enabled: true,
    minDelayMs,
    maxDelayMs: Math.max(minDelayMs, maxDelayMs),
    maxAttempts,
  };
}

function normalizeMaxAttempts(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("reconnect.maxAttempts must be a non-negative integer");
  }

  return value;
}

function reconnectAttemptsExceededError(
  maxAttempts: number,
  cause: unknown,
): Error {
  const error = new Error(
    `WebSocket subscription reconnect attempts exceeded ${maxAttempts}`,
  );

  if (cause !== undefined) {
    return Object.assign(error, { cause });
  }

  return error;
}

function reconnectDelayMs(
  { minDelayMs, maxDelayMs }: ReconnectConfig,
  attempt: number,
): number {
  const exponentialDelay = minDelayMs * 2 ** Math.max(0, attempt - 1);
  const boundedDelay = Math.min(exponentialDelay, maxDelayMs);
  const jitter = Math.random() * boundedDelay * 0.2;

  return Math.min(maxDelayMs, Math.round(boundedDelay + jitter));
}

async function waitForReconnect(
  delayMs: number,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted || delayMs <= 0) {
    return;
  }

  await new Promise<void>((resolve) => {
    const onAbort = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
      resolve();
    };

    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);

    signal.addEventListener("abort", onAbort, { once: true });
  });
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
      if (oldest) {
        const [oldestKey, oldestVersion] = oldest.split("\0", 2);
        const oldestVersions = this.versions.get(oldestKey);
        oldestVersions?.delete(oldestVersion);
        if (oldestVersions?.size === 0) {
          this.versions.delete(oldestKey);
        }
      }
    }
  }

  clear(): void {
    this.versions.clear();
    this.order.length = 0;
  }
}
