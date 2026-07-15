import WebSocketImpl from "ws";
import { DEFAULT_SUBSCRIPTION_FINALITY_STATUS } from "./constants";
import { cursorBeforeBlock } from "./cursor";
import { normalizeEvent, normalizeFelt, normalizeReorg } from "./normalize";
import type {
  Felt,
  RpcEvent,
  RpcReorg,
  RpcWebSocket,
  StreamMessage,
  SubscribeEventsOptions,
  SubscriptionBlockId,
  SubscriptionFinalityStatus,
  WebSocketFactory,
} from "./types";

const TOO_MANY_BLOCKS_BACK_CODE = 68;
const SUBSCRIBE_METHOD = "starknet_subscribeEvents";
const EVENT_NOTIFICATION = "starknet_subscriptionEvents";
const REORG_NOTIFICATION = "starknet_subscriptionReorg";
const UNSUBSCRIBE_METHOD = "starknet_unsubscribe";

const WS_OPEN = 1;
const WS_CLOSED = 3;
const DEFAULT_WS_IDLE_TIMEOUT_MS = 60_000;
const DEFAULT_WS_MAX_QUEUE_SIZE = 10_000;

type JsonRpcId = number | string;

type JsonRpcErrorPayload = {
  code?: number;
  message?: string;
  data?: unknown;
};

type JsonRpcResponse = {
  id?: JsonRpcId | null;
  result?: unknown;
  error?: JsonRpcErrorPayload;
};

export class TooManyBlocksBackError extends Error {
  readonly code = TOO_MANY_BLOCKS_BACK_CODE;
  readonly data: unknown;

  constructor(
    message = "starknet_subscribeEvents requested too much history",
    data?: unknown,
  ) {
    super(message);
    this.name = "TooManyBlocksBackError";
    this.data = data;
  }
}

export class WebSocketIdleTimeoutError extends Error {
  constructor(readonly idleTimeoutMs: number) {
    super(`WebSocket subscription idle for ${idleTimeoutMs}ms`);
    this.name = "WebSocketIdleTimeoutError";
  }
}

export class WebSocketQueueOverflowError extends Error {
  constructor(readonly maxQueueSize: number) {
    super(`WebSocket subscription queue exceeded ${maxQueueSize} messages`);
    this.name = "WebSocketQueueOverflowError";
  }
}

export async function* connectSubscribeEvents(
  options: SubscribeEventsOptions,
): AsyncGenerator<StreamMessage> {
  const subscribeParams = buildSubscribeParams(options);
  const idleTimeoutMs = normalizeIdleTimeoutMs(options.idleTimeoutMs);
  const maxQueueSize = normalizeMaxQueueSize(options.maxQueueSize);
  const ws = createWebSocket(options.url, options.webSocketFactory);
  const queue = new AsyncMessageQueue<unknown>(maxQueueSize);
  const requestId = 1;
  const unsubscribeRequestId = 2;
  let subscriptionId: unknown;
  let idleTimeout: ReturnType<typeof setTimeout> | undefined;
  let parseChain: Promise<void> = Promise.resolve();

  const closeOnAbort = () => {
    queue.close();
  };
  const clearIdleTimer = () => {
    if (idleTimeout) {
      clearTimeout(idleTimeout);
      idleTimeout = undefined;
    }
  };
  const resetIdleTimer = () => {
    clearIdleTimer();
    if (idleTimeoutMs === 0) {
      return;
    }

    idleTimeout = setTimeout(() => {
      queue.close(new WebSocketIdleTimeoutError(idleTimeoutMs));
      closeWebSocket(ws, 4000, "subscription idle timeout");
    }, idleTimeoutMs);
  };
  const parseAndQueueMessage = async (event: unknown) => {
    try {
      queue.push(await parseMessageEvent(event));
    } catch {
      // Drop malformed transport frames. Valid JSON-RPC error responses and
      // invalid Starknet event payloads are handled after parsing.
    }
  };

  const onMessage = (event: unknown) => {
    resetIdleTimer();
    parseChain = parseChain.then(
      () => parseAndQueueMessage(event),
      () => parseAndQueueMessage(event),
    );
    void parseChain;
  };
  const onError = (event: unknown) => {
    queue.close(toWebSocketError(event));
  };
  const onClose = () => {
    queue.close();
  };

  ws.addEventListener("message", onMessage);
  ws.addEventListener("error", onError);
  ws.addEventListener("close", onClose);
  options.signal?.addEventListener("abort", closeOnAbort, { once: true });

  try {
    throwIfAborted(options.signal);
    await waitForOpen(ws, options.signal);
    throwIfAborted(options.signal);
    resetIdleTimer();

    ws.send(
      JSON.stringify({
        jsonrpc: "2.0",
        id: requestId,
        method: SUBSCRIBE_METHOD,
        params: subscribeParams,
      }),
    );

    const pendingMessages: unknown[] = [];
    subscriptionId = await waitForSubscriptionId(
      queue,
      requestId,
      pendingMessages,
    );

    for (const pendingMessage of pendingMessages) {
      const message = parseNotification(pendingMessage, subscriptionId);
      if (message) {
        yield message;
      }
    }

    while (true) {
      const next = await queue.next();
      if (next.done) {
        return;
      }

      const message = parseNotification(next.value, subscriptionId);
      if (message) {
        yield message;
      }
    }
  } finally {
    clearIdleTimer();
    options.signal?.removeEventListener?.("abort", closeOnAbort);

    if (subscriptionId !== undefined && isOpen(ws)) {
      try {
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: unsubscribeRequestId,
            method: UNSUBSCRIBE_METHOD,
            params: { subscription_id: subscriptionId },
          }),
        );
      } catch {
        // Best-effort cleanup: the socket may already be closing.
      }
    }

    ws.removeEventListener?.("message", onMessage);
    ws.removeEventListener?.("error", onError);
    ws.removeEventListener?.("close", onClose);
    closeWebSocket(ws);
  }
}

function createWebSocket(
  url: string,
  factory?: WebSocketFactory,
): RpcWebSocket {
  if (factory) {
    return factory(url);
  }

  const WebSocketCtor = (
    globalThis as {
      WebSocket?: new (url: string) => RpcWebSocket;
    }
  ).WebSocket;

  return WebSocketCtor
    ? new WebSocketCtor(url)
    : (new WebSocketImpl(url) as unknown as RpcWebSocket);
}

function buildSubscribeParams(options: SubscribeEventsOptions) {
  const params: {
    block_id: SubscriptionBlockId;
    from_address?: Felt | Felt[];
    keys?: Felt[][];
    finality_status: SubscriptionFinalityStatus;
  } = {
    block_id: normalizeBlockId(options.blockId ?? "latest"),
    finality_status: normalizeFinalityStatus(
      options.finalityStatus ?? DEFAULT_SUBSCRIPTION_FINALITY_STATUS,
    ),
  };

  const fromAddress = normalizeAddresses(options.addresses);
  if (fromAddress !== undefined) {
    params.from_address = fromAddress;
  }

  if (options.keys) {
    params.keys = options.keys.map((keys, position) =>
      keys.map((key) => normalizeFelt(key, `subscription.keys[${position}]`)),
    );
  }

  return params;
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

function normalizeFinalityStatus(
  finalityStatus: SubscriptionFinalityStatus,
): SubscriptionFinalityStatus {
  if (
    finalityStatus !== "ACCEPTED_ON_L2" &&
    finalityStatus !== "PRE_CONFIRMED"
  ) {
    throw new Error(
      `Invalid starknet_subscribeEvents finalityStatus "${finalityStatus}". Use "ACCEPTED_ON_L2" or "PRE_CONFIRMED".`,
    );
  }

  return finalityStatus;
}

function normalizeAddresses(addresses?: Felt[]): Felt | Felt[] | undefined {
  if (!addresses || addresses.length === 0) {
    return undefined;
  }

  const normalized = Array.from(
    new Set(
      addresses.map((address) =>
        normalizeFelt(address, "subscription.addresses"),
      ),
    ),
  );
  return normalized.length === 1 ? normalized[0] : normalized;
}

function normalizeIdleTimeoutMs(value: number | undefined): number {
  if (value === undefined) {
    return DEFAULT_WS_IDLE_TIMEOUT_MS;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new Error("idleTimeoutMs must be a non-negative integer");
  }

  return value;
}

function normalizeMaxQueueSize(value: number | undefined): number {
  if (value === undefined) {
    return DEFAULT_WS_MAX_QUEUE_SIZE;
  }

  if (value === Number.POSITIVE_INFINITY) {
    return value;
  }

  if (!Number.isInteger(value) || value < 1) {
    throw new Error("maxQueueSize must be a positive integer");
  }

  return value;
}

async function waitForOpen(
  ws: RpcWebSocket,
  signal?: AbortSignal,
): Promise<void> {
  if (isOpen(ws)) {
    return;
  }

  if (ws.readyState === WS_CLOSED) {
    throw new Error("WebSocket closed before it opened");
  }

  await new Promise<void>((resolve, reject) => {
    const onOpen = () => {
      cleanup();
      resolve();
    };
    const onError = (event: unknown) => {
      cleanup();
      reject(toWebSocketError(event));
    };
    const onClose = () => {
      cleanup();
      reject(new Error("WebSocket closed before it opened"));
    };
    const onAbort = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      ws.removeEventListener?.("open", onOpen);
      ws.removeEventListener?.("error", onError);
      ws.removeEventListener?.("close", onClose);
      signal?.removeEventListener?.("abort", onAbort);
    };

    ws.addEventListener("open", onOpen, { once: true });
    ws.addEventListener("error", onError, { once: true });
    ws.addEventListener("close", onClose, { once: true });
    signal?.addEventListener("abort", onAbort, { once: true });
  });

  throwIfAborted(signal);
}

async function waitForSubscriptionId(
  queue: AsyncMessageQueue<unknown>,
  requestId: JsonRpcId,
  pendingMessages: unknown[],
): Promise<unknown> {
  while (true) {
    const next = await queue.next();
    if (next.done) {
      throw new Error("WebSocket closed before subscription was established");
    }

    const response = asResponseFor(next.value, requestId);
    if (!response) {
      pendingMessages.push(next.value);
      continue;
    }

    if (response.error) {
      throw toRpcError(response.error);
    }

    return response.result;
  }
}

function parseNotification(
  message: unknown,
  subscriptionId: unknown,
): StreamMessage | null {
  if (!isRecord(message)) {
    return null;
  }

  const { method } = message;
  if (method !== EVENT_NOTIFICATION && method !== REORG_NOTIFICATION) {
    return null;
  }

  const params = message.params;
  if (!isRecord(params)) {
    return null;
  }

  if (
    "subscription_id" in params &&
    !sameSubscriptionId(params.subscription_id, subscriptionId)
  ) {
    return null;
  }

  const result = extractNotificationResult(params, method);
  if (!isRecord(result)) {
    return null;
  }

  if (method === EVENT_NOTIFICATION) {
    const event = normalizeEvent(result as unknown as RpcEvent);
    return { type: "event", event, cursor: event.cursor };
  }

  const reorg = normalizeReorg(result as unknown as RpcReorg);
  return {
    type: "reorg",
    reorg,
    rollbackCursor: cursorBeforeBlock(reorg.startingBlockNumber),
  };
}

function extractNotificationResult(
  params: Record<string, unknown>,
  method: unknown,
): unknown {
  if ("result" in params) {
    return params.result;
  }

  if (method === EVENT_NOTIFICATION && "event" in params) {
    return params.event;
  }

  if (method === REORG_NOTIFICATION && "reorg" in params) {
    return params.reorg;
  }

  return params;
}

async function parseMessageEvent(event: unknown): Promise<unknown> {
  const payload = isRecord(event) && "data" in event ? event.data : event;
  const text = await payloadToText(payload);
  return JSON.parse(text);
}

async function payloadToText(payload: unknown): Promise<string> {
  if (typeof payload === "string") {
    return payload;
  }

  if (payload instanceof ArrayBuffer) {
    return new TextDecoder().decode(payload);
  }

  if (ArrayBuffer.isView(payload)) {
    return new TextDecoder().decode(payload);
  }

  if (isTextLikeBlob(payload)) {
    return payload.text();
  }

  return String(payload);
}

function asResponseFor(
  message: unknown,
  requestId: JsonRpcId,
): JsonRpcResponse | null {
  if (!isRecord(message) || !("id" in message)) {
    return null;
  }

  if (message.id !== requestId) {
    return null;
  }

  const response: JsonRpcResponse = { id: message.id as JsonRpcId };
  if ("result" in message) {
    response.result = message.result;
  }
  if ("error" in message && isRecord(message.error)) {
    const { code, message: errorMessage, data } = message.error;
    response.error = {
      code: typeof code === "number" ? code : undefined,
      message: typeof errorMessage === "string" ? errorMessage : undefined,
      data,
    };
  }

  return response;
}

function toRpcError(error: JsonRpcErrorPayload): Error {
  if (error.code === TOO_MANY_BLOCKS_BACK_CODE) {
    return new TooManyBlocksBackError(error.message, error.data);
  }

  const rpcError = new Error(
    `JSON-RPC error${error.code === undefined ? "" : ` ${error.code}`}: ${
      error.message ?? "unknown error"
    }`,
  );

  return Object.assign(rpcError, {
    code: error.code,
    data: error.data,
  });
}

function sameSubscriptionId(left: unknown, right: unknown): boolean {
  return left === right || String(left) === String(right);
}

function isOpen(ws: RpcWebSocket): boolean {
  return ws.readyState === undefined || ws.readyState === WS_OPEN;
}

function closeWebSocket(
  ws: RpcWebSocket,
  code = 1000,
  reason = "subscription closed",
): void {
  if (ws.readyState === WS_CLOSED) {
    return;
  }

  try {
    ws.close(code, reason);
  } catch {
    // Closing is best effort across structural WebSocket implementations.
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason ?? new Error("Operation aborted");
  }
}

function toWebSocketError(event: unknown): Error {
  if (event instanceof Error) {
    return event;
  }

  if (isRecord(event)) {
    if (event.error instanceof Error) {
      return event.error;
    }

    if (typeof event.message === "string") {
      return new Error(event.message);
    }
  }

  return new Error("WebSocket error");
}

function isTextLikeBlob(value: unknown): value is { text(): Promise<string> } {
  return isRecord(value) && "text" in value && typeof value.text === "function";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

class AsyncMessageQueue<T> {
  private values: T[] = [];
  private waiters: Array<{
    resolve: (value: IteratorResult<T>) => void;
    reject: (reason?: unknown) => void;
  }> = [];
  private closed = false;
  private error: unknown;

  constructor(private readonly maxSize: number) {}

  push(value: T): void {
    if (this.closed) {
      return;
    }

    const waiter = this.waiters.shift();
    if (waiter) {
      waiter.resolve({ done: false, value });
      return;
    }

    if (this.values.length >= this.maxSize) {
      this.close(new WebSocketQueueOverflowError(this.maxSize));
      return;
    }

    this.values.push(value);
  }

  close(error?: unknown): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.error = error;

    for (const waiter of this.waiters.splice(0)) {
      if (error) {
        waiter.reject(error);
      } else {
        waiter.resolve({ done: true, value: undefined });
      }
    }
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.values.length > 0) {
      const value = this.values.shift() as T;
      return { done: false, value };
    }

    if (this.closed) {
      if (this.error) {
        throw this.error;
      }

      return { done: true, value: undefined };
    }

    return new Promise<IteratorResult<T>>((resolve, reject) => {
      this.waiters.push({ resolve, reject });
    });
  }
}
