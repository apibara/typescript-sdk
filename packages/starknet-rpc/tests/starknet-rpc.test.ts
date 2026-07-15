import { afterEach, describe, expect, it, vi } from "vitest";
import { backfillEvents } from "../src/backfill";
import { StarknetBlockCache, getBlockWithTxHashes } from "../src/block-cache";
import { compareEventCursor, eventCursorKey } from "../src/cursor";
import { getEvents } from "../src/http";
import {
  StarknetEventCursorError,
  normalizeEvent,
  normalizeFelt,
} from "../src/normalize";
import { streamEvents } from "../src/stream";
import { StarknetRpcStream } from "../src/stream-config";
import { subscribeEvents } from "../src/subscribe";
import type { EventCursor, RpcEvent } from "../src/types";
import {
  TooManyBlocksBackError,
  WebSocketQueueOverflowError,
  connectSubscribeEvents,
} from "../src/ws";

const RPC_URL = "http://example.test/rpc";
const WS_URL = "ws://example.test/rpc";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("felt normalization", () => {
  it("pads felts to canonical Starknet hex", () => {
    expect(normalizeFelt("0xAbC")).toBe(`0x${"0".repeat(61)}abc`);
    expect(() => normalizeFelt("abc")).toThrow(/0x-prefixed/);
  });
});

describe("cursor comparison", () => {
  it("orders by block number, transaction index, and per-transaction event index", () => {
    expect(
      compareEventCursor(cursor(1, "0x2", 0, 0), cursor(2, "0x1", 0, 0)),
    ).toBeLessThan(0);
    expect(
      compareEventCursor(cursor(2, "0xff", 0, 0), cursor(2, "0x1", 1, 0)),
    ).toBeLessThan(0);
    expect(
      compareEventCursor(cursor(2, "0x2", 1, 1), cursor(2, "0x2", 1, 0)),
    ).toBeGreaterThan(0);
    expect(
      compareEventCursor(cursor(2, "0x2", 1, 0), cursor(2, "0x1", 1, 0)),
    ).toBe(0);
  });

  it("keeps the cursor identity keyed by transaction hash and event index", () => {
    expect(eventCursorKey(cursor(5, "0xabc", 1, 2))).toBe(
      eventCursorKey(cursor(5, "0x0abc", 99, 2)),
    );
  });
});

describe("block cache", () => {
  it("caches blocks by number and hash and invalidates from a reorg start", async () => {
    const requests: unknown[] = [];
    mockRpcFetch((request) => {
      requests.push(request);
      return {
        block_hash: "0xabc",
        block_number: 10,
        timestamp: 100,
        transactions: [],
      };
    });

    const cache = new StarknetBlockCache({ url: RPC_URL });

    await expect(
      cache.getBlockWithTxHashes({ block_number: 10 }),
    ).resolves.toMatchObject({
      block_number: 10,
    });
    await expect(
      cache.getBlockWithTxHashes({ block_number: 10 }),
    ).resolves.toMatchObject({
      block_number: 10,
    });
    expect(requests).toHaveLength(1);
    expect(
      cache.getCachedMetadata({ block_hash: normalizeFelt("0xabc") }),
    ).toMatchObject({
      blockNumber: 10,
      timestamp: 100,
    });

    cache.invalidateFrom(10);

    await cache.getBlockWithTxHashes({ block_number: 10 });
    expect(requests).toHaveLength(2);
  });
});

describe("event normalization", () => {
  it("requires transaction_index and includes it in the cursor", () => {
    expect(normalizeEvent(rawEvent({ transactionIndex: 7 })).cursor).toEqual({
      blockNumber: 1,
      transactionIndex: 7,
      transactionHash: normalizeFelt("0x1"),
      eventIndex: 0,
    });

    const { transaction_index: _transactionIndex, ...missingTransactionIndex } =
      rawEvent();

    expect(() => normalizeEvent(missingTransactionIndex)).toThrow(
      /Starknet JSON-RPC >= 0\.10/,
    );

    const { block_number: _blockNumber, ...missingBlockNumber } = rawEvent();

    expect(() => normalizeEvent(missingBlockNumber)).toThrow(
      StarknetEventCursorError,
    );
  });
});

describe("HTTP backfill", () => {
  it("follows continuation tokens without skipping pages", async () => {
    const requests: unknown[] = [];
    mockRpcFetch((request) => {
      requests.push(request);

      if (request.method !== "starknet_getEvents") {
        throw new Error(`unexpected method ${request.method}`);
      }

      if (!singleParam(request).continuation_token) {
        return {
          events: [
            rawEvent({ blockNumber: 1, transactionHash: "0x1", eventIndex: 0 }),
            rawEvent({ blockNumber: 1, transactionHash: "0x2", eventIndex: 0 }),
          ],
          continuation_token: "page-2",
        };
      }

      return {
        events: [
          rawEvent({ blockNumber: 2, transactionHash: "0x1", eventIndex: 0 }),
        ],
      };
    });

    const messages = await collect(
      backfillEvents({
        url: RPC_URL,
        fromBlock: { block_number: 1 },
        toBlock: { block_number: 2 },
        chunkSize: 2,
      }),
    );

    expect(messages.map((message) => message.cursor.blockNumber)).toEqual([
      1, 1, 2,
    ]);
    expect(requests).toHaveLength(2);
    expect((requests[0] as JsonRpcRequest).params).toEqual([
      {
        from_block: { block_number: 1 },
        to_block: { block_number: 2 },
        chunk_size: 2,
      },
    ]);
    expect((requests[1] as JsonRpcRequest).params).toEqual([
      {
        from_block: { block_number: 1 },
        to_block: { block_number: 2 },
        chunk_size: 2,
        continuation_token: "page-2",
      },
    ]);
  });

  it("sends getEvents filters as positional JSON-RPC params", async () => {
    const requests: unknown[] = [];
    mockRpcFetch((request) => {
      requests.push(request);
      return { events: [] };
    });

    await getEvents({
      url: RPC_URL,
      fromBlock: { block_number: 1 },
      toBlock: { block_number: 2 },
      addresses: ["0xaaa"],
      keys: [["0x111"]],
      chunkSize: 25,
      continuationToken: "page-2",
    });

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      method: "starknet_getEvents",
    });
    expect((requests[0] as JsonRpcRequest).params).toEqual([
      {
        from_block: { block_number: 1 },
        to_block: { block_number: 2 },
        address: normalizeFelt("0xaaa"),
        keys: [[normalizeFelt("0x111")]],
        chunk_size: 25,
        continuation_token: "page-2",
      },
    ]);
  });

  it("does not accumulate fetch abort listeners on a reused parent signal", async () => {
    const controller = new AbortController();
    const addListener = vi.spyOn(controller.signal, "addEventListener");
    const removeListener = vi.spyOn(controller.signal, "removeEventListener");
    const fetchSignals: Array<AbortSignal | null | undefined> = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        fetchSignals.push(init?.signal);
        const request = JSON.parse(String(init?.body)) as JsonRpcRequest & {
          id?: number | string;
        };

        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id: request.id ?? 1,
            result: { events: [] },
          }),
          {
            headers: {
              "content-type": "application/json",
            },
          },
        );
      }),
    );

    for (let i = 0; i < 3; i++) {
      await getEvents({
        url: RPC_URL,
        fromBlock: { block_number: i },
        signal: controller.signal,
      });
    }

    expect(addListener).toHaveBeenCalledTimes(3);
    expect(removeListener).toHaveBeenCalledTimes(3);
    expect(fetchSignals).toHaveLength(3);
    expect(fetchSignals.every((signal) => signal !== controller.signal)).toBe(
      true,
    );
  });

  it("defaults omitted backfill toBlock to latest accepted block", async () => {
    const requests: unknown[] = [];
    mockRpcFetch((request) => {
      requests.push(request);
      return { events: [] };
    });

    await collect(
      backfillEvents({
        url: RPC_URL,
        fromBlock: { block_number: 1 },
      }),
    );

    expect(requests).toHaveLength(1);
    expect((requests[0] as JsonRpcRequest).params).toEqual([
      {
        from_block: { block_number: 1 },
        to_block: "latest",
        chunk_size: 100,
      },
    ]);
  });

  it("sends v0.10 multi-address RPC filters and filters client-side", async () => {
    const requests: unknown[] = [];
    mockRpcFetch((request) => {
      requests.push(request);
      return {
        events: [
          rawEvent({ fromAddress: "0xaaa", transactionHash: "0x1" }),
          rawEvent({ fromAddress: "0xbbb", transactionHash: "0x2" }),
          rawEvent({ fromAddress: "0xccc", transactionHash: "0x3" }),
        ],
      };
    });

    const page = await getEvents({
      url: RPC_URL,
      addresses: ["0xaaa", "0xbbb"],
    });

    expect(page.events.map((event) => event.transactionHash)).toEqual([
      normalizeFelt("0x1"),
      normalizeFelt("0x2"),
    ]);
    expect(requests).toHaveLength(1);
    expect((requests[0] as JsonRpcRequest).params).toEqual([
      {
        address: [normalizeFelt("0xaaa"), normalizeFelt("0xbbb")],
        chunk_size: 100,
      },
    ]);
  });

  it("sends getBlockWithTxHashes block ids as positional JSON-RPC params", async () => {
    const requests: unknown[] = [];
    mockRpcFetch((request) => {
      requests.push(request);
      return {
        block_hash: "0x123",
        block_number: 10,
        timestamp: 100,
        transactions: [],
      };
    });

    await getBlockWithTxHashes({
      url: RPC_URL,
      blockId: { block_number: 10 },
    });

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      method: "starknet_getBlockWithTxHashes",
    });
    expect((requests[0] as JsonRpcRequest).params).toEqual([
      { block_number: 10 },
    ]);
  });

  it("resumes from a persisted cursor and skips replayed events", async () => {
    const requests: unknown[] = [];
    const resumeCursor = cursor(5, "0x2", 1, 1);

    mockRpcFetch((request) => {
      requests.push(request);
      return {
        events: [
          rawEvent({
            blockNumber: 5,
            transactionHash: "0x1",
            transactionIndex: 0,
            eventIndex: 0,
          }),
          rawEvent({
            blockNumber: 5,
            transactionHash: "0x2",
            transactionIndex: 1,
            eventIndex: 1,
          }),
          rawEvent({
            blockNumber: 5,
            transactionHash: "0x3",
            transactionIndex: 2,
            eventIndex: 0,
          }),
        ],
      };
    });

    const messages = await collect(
      backfillEvents({
        url: RPC_URL,
        fromBlock: { block_number: 0 },
        continuationToken: "old-token",
        cursor: resumeCursor,
      }),
    );

    expect(messages).toHaveLength(1);
    expect(messages[0].cursor).toMatchObject({
      blockNumber: 5,
      transactionIndex: 2,
      transactionHash: normalizeFelt("0x3"),
      eventIndex: 0,
    });
    expect((requests[0] as JsonRpcRequest).params).toEqual([
      {
        from_block: { block_number: 5 },
        to_block: "latest",
        chunk_size: 100,
      },
    ]);
    expect(
      singleParam(requests[0] as JsonRpcRequest).continuation_token,
    ).toBeUndefined();
  });
});

describe("RPC stream config", () => {
  it("fetches accepted event blocks for the Apibara RPC client path", async () => {
    const requests: JsonRpcRequest[] = [];
    mockRpcFetch((request) => {
      requests.push(request);

      if (request.method === "starknet_getEvents") {
        return {
          events: [
            rawEvent({ blockNumber: 1, transactionHash: "0x1" }),
            rawEvent({
              blockNumber: 2,
              transactionHash: "0x2",
              transactionIndex: 1,
            }),
          ],
        };
      }

      if (request.method === "starknet_getBlockWithTxHashes") {
        const blockId = request.params?.[0];
        const blockNumber = isBlockNumberParam(blockId)
          ? blockId.block_number
          : 0;
        return rpcBlock(blockNumber);
      }

      throw new Error(`unexpected method ${request.method}`);
    });

    const stream = new StarknetRpcStream({ url: RPC_URL });
    const result = await stream.fetchBlockRange({
      startBlock: 1n,
      maxBlock: 2n,
      force: false,
      clampAllowed: false,
      filter: {},
    });

    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({
      endCursor: {
        orderKey: 1n,
        uniqueKey: normalizeFelt("0x1"),
      },
      block: {
        header: {
          blockNumber: 1,
          blockHash: normalizeFelt("0x1"),
          parentBlockHash: normalizeFelt("0x0"),
        },
        events: [
          {
            transactionHash: normalizeFelt("0x1"),
          },
        ],
      },
    });
    expect(result.data[1]).toMatchObject({
      endCursor: {
        orderKey: 2n,
        uniqueKey: normalizeFelt("0x2"),
      },
      block: {
        events: [
          {
            transactionHash: normalizeFelt("0x2"),
          },
        ],
      },
    });
    expect(
      requests.filter((request) => request.method === "starknet_getEvents"),
    ).toHaveLength(1);
  });

  it("maps finalized cursor requests to l1_accepted", async () => {
    const requests: JsonRpcRequest[] = [];
    mockRpcFetch((request) => {
      requests.push(request);
      return rpcBlock(10);
    });

    const stream = new StarknetRpcStream({ url: RPC_URL });
    await expect(
      stream.fetchCursor({ blockTag: "finalized" }),
    ).resolves.toEqual({
      blockNumber: 10n,
      blockHash: normalizeFelt("0xa"),
      parentBlockHash: normalizeFelt("0x9"),
    });
    expect(requests[0].params).toEqual(["l1_accepted"]);
  });

  it("clamps accepted event backfill ranges when allowed", async () => {
    const requests: JsonRpcRequest[] = [];
    mockRpcFetch((request) => {
      requests.push(request);

      if (request.method === "starknet_getEvents") {
        return { events: [] };
      }

      if (request.method === "starknet_getBlockWithTxHashes") {
        const blockId = request.params?.[0];
        const blockNumber = isBlockNumberParam(blockId)
          ? blockId.block_number
          : 0;
        return rpcBlock(blockNumber);
      }

      throw new Error(`unexpected method ${request.method}`);
    });

    const stream = new StarknetRpcStream({
      url: RPC_URL,
      getEventsRangeSize: 3n,
    });
    const result = await stream.fetchBlockRange({
      startBlock: 1n,
      maxBlock: 10n,
      force: true,
      clampAllowed: true,
      filter: {},
    });

    expect(result.endBlock).toBe(3n);
    const getEventsRequest = requests.find(
      (request) => request.method === "starknet_getEvents",
    );
    expect(getEventsRequest).toBeDefined();
    expect(singleParam(getEventsRequest!).to_block).toEqual({
      block_number: 3,
    });
  });
});

describe("WebSocket subscriptions", () => {
  it("subscribes to pre-confirmed events by default", async () => {
    const sockets: MockWebSocket[] = [];
    const subscription = subscribeEvents({
      url: WS_URL,
      blockId: "latest",
      webSocketFactory: mockWebSocketFactory(sockets),
    });
    const iterator = subscription[Symbol.asyncIterator]();

    const next = iterator.next();
    const socket = await waitForSocket(sockets, 0);
    socket.open();
    const subscribe = await waitForSent(socket, "starknet_subscribeEvents");
    expect(
      (subscribe.params as { finality_status: unknown }).finality_status,
    ).toBe("PRE_CONFIRMED");

    socket.message({ jsonrpc: "2.0", id: 1, result: "sub-1" });
    socket.message(
      eventNotification("sub-1", rawEvent({ finalityStatus: "PRE_CONFIRMED" })),
    );

    await expect(next).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        event: {
          finalityStatus: "PRE_CONFIRMED",
        },
      },
    });

    await subscription.unsubscribe();
  });

  it("emits Pathfinder reorg notifications", async () => {
    const sockets: MockWebSocket[] = [];
    const iterator = connectSubscribeEvents({
      url: WS_URL,
      webSocketFactory: mockWebSocketFactory(sockets),
    });

    const next = iterator.next();
    const socket = await waitForSocket(sockets, 0);
    socket.open();
    await waitForSent(socket, "starknet_subscribeEvents");
    socket.message({ jsonrpc: "2.0", id: 1, result: "sub-1" });
    socket.message({
      jsonrpc: "2.0",
      method: "starknet_subscriptionReorg",
      params: {
        subscription_id: "sub-1",
        result: {
          starting_block_number: 12,
          starting_block_hash: "0xabc",
          ending_block_number: 13,
          ending_block_hash: "0xdef",
        },
      },
    });

    await expect(next).resolves.toMatchObject({
      done: false,
      value: {
        type: "reorg",
        reorg: {
          startingBlockNumber: 12,
          startingBlockHash: normalizeFelt("0xabc"),
          endingBlockNumber: 13,
          endingBlockHash: normalizeFelt("0xdef"),
        },
        rollbackCursor: {
          blockNumber: 12,
          transactionIndex: -1,
          transactionHash: "0x0",
          eventIndex: -1,
        },
      },
    });

    await iterator.return?.(undefined);
  });

  it("buffers notifications that arrive before the subscription response", async () => {
    const sockets: MockWebSocket[] = [];
    const iterator = connectSubscribeEvents({
      url: WS_URL,
      webSocketFactory: mockWebSocketFactory(sockets),
    });

    const next = iterator.next();
    const socket = await waitForSocket(sockets, 0);
    socket.open();
    await waitForSent(socket, "starknet_subscribeEvents");
    socket.message(eventNotification("sub-1", rawEvent({ blockNumber: 1 })));
    socket.message({ jsonrpc: "2.0", id: 1, result: "sub-1" });

    await expect(next).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 1,
        },
      },
    });

    await iterator.return?.(undefined);
  });

  it("drops malformed WebSocket frames without reconnecting", async () => {
    const sockets: MockWebSocket[] = [];
    const iterator = connectSubscribeEvents({
      url: WS_URL,
      idleTimeoutMs: 0,
      webSocketFactory: mockWebSocketFactory(sockets),
    });

    const next = iterator.next();
    const socket = await waitForSocket(sockets, 0);
    socket.open();
    await waitForSent(socket, "starknet_subscribeEvents");
    socket.rawMessage("not-json");
    socket.message({ jsonrpc: "2.0", id: 1, result: "sub-1" });
    socket.rawMessage("{");
    socket.message(eventNotification("sub-1", rawEvent({ blockNumber: 1 })));

    await expect(next).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 1,
        },
      },
    });
    expect(sockets).toHaveLength(1);

    await iterator.return?.(undefined);
  });

  it("surfaces queue overflow instead of buffering without bound", async () => {
    const sockets: MockWebSocket[] = [];
    const iterator = connectSubscribeEvents({
      url: WS_URL,
      idleTimeoutMs: 0,
      maxQueueSize: 1,
      webSocketFactory: mockWebSocketFactory(sockets),
    });

    const first = iterator.next();
    const socket = await waitForSocket(sockets, 0);
    socket.open();
    await waitForSent(socket, "starknet_subscribeEvents");
    socket.message({ jsonrpc: "2.0", id: 1, result: "sub-1" });
    socket.message(eventNotification("sub-1", rawEvent({ blockNumber: 1 })));

    await expect(first).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 1,
        },
      },
    });

    socket.message(
      eventNotification(
        "sub-1",
        rawEvent({ blockNumber: 2, transactionHash: "0x2" }),
      ),
    );
    await flushTasks();
    socket.message(
      eventNotification(
        "sub-1",
        rawEvent({ blockNumber: 3, transactionHash: "0x3" }),
      ),
    );
    socket.message(
      eventNotification(
        "sub-1",
        rawEvent({ blockNumber: 4, transactionHash: "0x4" }),
      ),
    );
    socket.message(
      eventNotification(
        "sub-1",
        rawEvent({ blockNumber: 5, transactionHash: "0x5" }),
      ),
    );
    await flushTasks();

    let overflow: unknown;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await iterator.next();
      } catch (error) {
        overflow = error;
        break;
      }
    }

    expect(overflow).toBeInstanceOf(WebSocketQueueOverflowError);
  });

  it("dedupes replayed events after reconnect", async () => {
    const sockets: MockWebSocket[] = [];
    const subscription = subscribeEvents({
      url: WS_URL,
      blockId: { block_number: 1 },
      reconnect: { minDelayMs: 0, maxDelayMs: 0 },
      webSocketFactory: mockWebSocketFactory(sockets),
    });
    const iterator = subscription[Symbol.asyncIterator]();

    const first = iterator.next();
    const socket1 = await waitForSocket(sockets, 0);
    socket1.open();
    await waitForSent(socket1, "starknet_subscribeEvents");
    socket1.message({ jsonrpc: "2.0", id: 1, result: "sub-1" });
    socket1.message(eventNotification("sub-1", rawEvent({ blockNumber: 1 })));

    await expect(first).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 1,
        },
      },
    });

    const second = iterator.next();
    socket1.close();
    const socket2 = await waitForSocket(sockets, 1);
    socket2.open();
    await waitForSent(socket2, "starknet_subscribeEvents");
    socket2.message({ jsonrpc: "2.0", id: 1, result: "sub-2" });
    socket2.message(eventNotification("sub-2", rawEvent({ blockNumber: 1 })));
    socket2.message(
      eventNotification(
        "sub-2",
        rawEvent({ blockNumber: 2, transactionHash: "0x2" }),
      ),
    );

    await expect(second).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 2,
        },
      },
    });

    await subscription.unsubscribe();
  });

  it("reconnects after the WebSocket idle timeout", async () => {
    const sockets: MockWebSocket[] = [];
    const subscription = subscribeEvents({
      url: WS_URL,
      blockId: { block_number: 1 },
      idleTimeoutMs: 1,
      reconnect: { minDelayMs: 0, maxDelayMs: 0 },
      webSocketFactory: mockWebSocketFactory(sockets),
    });
    const iterator = subscription[Symbol.asyncIterator]();

    const next = iterator.next();
    const socket1 = await waitForSocket(sockets, 0);
    socket1.open();
    await waitForSent(socket1, "starknet_subscribeEvents");
    socket1.message({ jsonrpc: "2.0", id: 1, result: "sub-1" });

    const socket2 = await waitForSocket(sockets, 1);
    socket2.open();
    await waitForSent(socket2, "starknet_subscribeEvents");
    socket2.message({ jsonrpc: "2.0", id: 1, result: "sub-2" });
    socket2.message(
      eventNotification(
        "sub-2",
        rawEvent({ blockNumber: 1, transactionHash: "0x1" }),
      ),
    );

    await expect(next).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 1,
        },
      },
    });

    await subscription.unsubscribe();
  });

  it("honors a reconnect attempt ceiling", async () => {
    const sockets: MockWebSocket[] = [];
    const subscription = subscribeEvents({
      url: WS_URL,
      reconnect: { minDelayMs: 0, maxDelayMs: 0, maxAttempts: 0 },
      webSocketFactory: mockWebSocketFactory(sockets),
    });
    const iterator = subscription[Symbol.asyncIterator]();

    const next = iterator.next();
    const socket = await waitForSocket(sockets, 0);
    socket.open();
    await waitForSent(socket, "starknet_subscribeEvents");
    socket.close();

    await expect(next).rejects.toThrow(/reconnect attempts exceeded 0/);
    expect(sockets).toHaveLength(1);

    await subscription.unsubscribe();
  });

  it("emits repeated event identities when finality changes", async () => {
    const sockets: MockWebSocket[] = [];
    const subscription = subscribeEvents({
      url: WS_URL,
      blockId: { block_number: 1 },
      webSocketFactory: mockWebSocketFactory(sockets),
    });
    const iterator = subscription[Symbol.asyncIterator]();

    const first = iterator.next();
    const socket = await waitForSocket(sockets, 0);
    socket.open();
    await waitForSent(socket, "starknet_subscribeEvents");
    socket.message({ jsonrpc: "2.0", id: 1, result: "sub-1" });
    socket.message(
      eventNotification(
        "sub-1",
        rawEvent({
          blockNumber: 1,
          blockHash: undefined,
          transactionHash: "0x1",
          finalityStatus: "PRE_CONFIRMED",
        }),
      ),
    );

    await expect(first).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 1,
          transactionHash: normalizeFelt("0x1"),
        },
        event: {
          blockHash: undefined,
          finalityStatus: "PRE_CONFIRMED",
        },
      },
    });

    const accepted = iterator.next();
    socket.message(
      eventNotification(
        "sub-1",
        rawEvent({
          blockNumber: 1,
          blockHash: "0xabc",
          transactionHash: "0x1",
          finalityStatus: "ACCEPTED_ON_L2",
        }),
      ),
    );

    await expect(accepted).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 1,
          transactionHash: normalizeFelt("0x1"),
        },
        event: {
          blockHash: normalizeFelt("0xabc"),
          finalityStatus: "ACCEPTED_ON_L2",
        },
      },
    });

    const next = iterator.next();
    socket.message(
      eventNotification(
        "sub-1",
        rawEvent({
          blockNumber: 1,
          blockHash: "0xabc",
          transactionHash: "0x1",
          finalityStatus: "ACCEPTED_ON_L2",
        }),
      ),
    );
    socket.message(
      eventNotification(
        "sub-1",
        rawEvent({ blockNumber: 2, transactionHash: "0x2" }),
      ),
    );

    await expect(next).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 2,
          transactionHash: normalizeFelt("0x2"),
        },
      },
    });

    await subscription.unsubscribe();
  });

  it("surfaces TooManyBlocksBack without trying historical WS backfill", async () => {
    const sockets: MockWebSocket[] = [];
    const iterator = connectSubscribeEvents({
      url: WS_URL,
      blockId: { block_number: 1 },
      webSocketFactory: mockWebSocketFactory(sockets),
    });

    const next = iterator.next();
    const socket = await waitForSocket(sockets, 0);
    socket.open();
    await waitForSent(socket, "starknet_subscribeEvents");
    socket.message({
      jsonrpc: "2.0",
      id: 1,
      error: {
        code: 68,
        message: "Cannot go back more than 1024 blocks",
        data: { limit: 1024, requested: 1025 },
      },
    });

    await expect(next).rejects.toBeInstanceOf(TooManyBlocksBackError);
    expect(socket.sent).toHaveLength(1);
  });

  it("rejects subscription-only block tags before sending", async () => {
    const sockets: MockWebSocket[] = [];
    const iterator = connectSubscribeEvents({
      url: WS_URL,
      blockId: "pending",
      webSocketFactory: mockWebSocketFactory(sockets),
    } as never);

    const next = iterator.next();

    await expect(next).rejects.toThrow(/blockId tag/);
    expect(sockets).toHaveLength(0);
  });

  it("rejects unsupported subscription finality statuses before sending", async () => {
    const sockets: MockWebSocket[] = [];
    const iterator = connectSubscribeEvents({
      url: WS_URL,
      finalityStatus: "ACCEPTED_ON_L1",
      webSocketFactory: mockWebSocketFactory(sockets),
    } as never);

    const next = iterator.next();

    await expect(next).rejects.toThrow(/finalityStatus/);
    expect(sockets).toHaveLength(0);
  });
});

describe("combined stream", () => {
  it("rejects bounded toBlock options", async () => {
    const iterator = streamEvents({
      url: RPC_URL,
      wsUrl: WS_URL,
      toBlock: { block_number: 10 },
    } as never);

    await expect(iterator.next()).rejects.toThrow(/toBlock/);
  });

  it("dedupes the inclusive HTTP-to-WS handoff", async () => {
    const sockets: MockWebSocket[] = [];
    mockRpcFetch((request) => {
      if (request.method === "starknet_getBlockWithTxHashes") {
        return {
          block_hash: "0x123",
          block_number: 10,
          timestamp: 100,
          transactions: [],
        };
      }

      if (request.method === "starknet_getEvents") {
        return {
          events: [rawEvent({ blockNumber: 10, transactionHash: "0x1" })],
        };
      }

      throw new Error(`unexpected method ${request.method}`);
    });

    const iterator = streamEvents({
      url: RPC_URL,
      wsUrl: WS_URL,
      fromBlock: { block_number: 0 },
      webSocketFactory: mockWebSocketFactory(sockets),
    });

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 10,
        },
      },
    });

    const live = iterator.next();
    const socket = await waitForSocket(sockets, 0);
    socket.open();
    const subscribe = await waitForSent(socket, "starknet_subscribeEvents");
    expect((subscribe.params as { block_id: unknown }).block_id).toEqual({
      block_number: 10,
    });
    expect(
      (subscribe.params as { finality_status: unknown }).finality_status,
    ).toBe("PRE_CONFIRMED");
    socket.message({ jsonrpc: "2.0", id: 1, result: "sub-1" });
    socket.message(
      eventNotification(
        "sub-1",
        rawEvent({ blockNumber: 10, transactionHash: "0x1" }),
      ),
    );
    socket.message(
      eventNotification(
        "sub-1",
        rawEvent({ blockNumber: 11, transactionHash: "0x2" }),
      ),
    );

    await expect(live).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 11,
        },
      },
    });

    await iterator.return?.(undefined);
  });

  it("emits live finality updates for the same event identity", async () => {
    const sockets: MockWebSocket[] = [];
    mockRpcFetch((request) => {
      if (request.method === "starknet_getBlockWithTxHashes") {
        return {
          block_hash: "0x123",
          block_number: 10,
          timestamp: 100,
          transactions: [],
        };
      }

      if (request.method === "starknet_getEvents") {
        return { events: [] };
      }

      throw new Error(`unexpected method ${request.method}`);
    });

    const iterator = streamEvents({
      url: RPC_URL,
      wsUrl: WS_URL,
      fromBlock: { block_number: 10 },
      webSocketFactory: mockWebSocketFactory(sockets),
    });

    const first = iterator.next();
    const socket = await waitForSocket(sockets, 0);
    socket.open();
    await waitForSent(socket, "starknet_subscribeEvents");
    socket.message({ jsonrpc: "2.0", id: 1, result: "sub-1" });
    socket.message(
      eventNotification(
        "sub-1",
        rawEvent({
          blockNumber: 11,
          blockHash: undefined,
          transactionHash: "0x11",
          finalityStatus: "PRE_CONFIRMED",
        }),
      ),
    );

    await expect(first).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 11,
          transactionHash: normalizeFelt("0x11"),
        },
        event: {
          blockHash: undefined,
          finalityStatus: "PRE_CONFIRMED",
        },
      },
    });

    const accepted = iterator.next();
    socket.message(
      eventNotification(
        "sub-1",
        rawEvent({
          blockNumber: 11,
          blockHash: "0xabc",
          transactionHash: "0x11",
          finalityStatus: "ACCEPTED_ON_L2",
        }),
      ),
    );

    await expect(accepted).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 11,
          transactionHash: normalizeFelt("0x11"),
        },
        event: {
          blockHash: normalizeFelt("0xabc"),
          finalityStatus: "ACCEPTED_ON_L2",
        },
      },
    });

    await iterator.return?.(undefined);
  });

  it("catches up over HTTP when the WS handoff block is too old", async () => {
    const sockets: MockWebSocket[] = [];
    const eventRequests: Array<Record<string, unknown>> = [];
    let latestCalls = 0;

    mockRpcFetch((request) => {
      if (request.method === "starknet_getBlockWithTxHashes") {
        latestCalls += 1;
        const blockNumber = latestCalls === 1 ? 10 : 12;
        return {
          block_hash: `0x${blockNumber.toString(16)}`,
          block_number: blockNumber,
          timestamp: 100 + blockNumber,
          transactions: [],
        };
      }

      if (request.method === "starknet_getEvents") {
        const filter = singleParam(request);
        eventRequests.push(filter);

        if (
          isBlockNumberParam(filter.to_block) &&
          filter.to_block.block_number === 12
        ) {
          return {
            events: [rawEvent({ blockNumber: 11, transactionHash: "0x11" })],
          };
        }

        return { events: [] };
      }

      throw new Error(`unexpected method ${request.method}`);
    });

    const iterator = streamEvents({
      url: RPC_URL,
      wsUrl: WS_URL,
      fromBlock: { block_number: 0 },
      webSocketFactory: mockWebSocketFactory(sockets),
    });

    const next = iterator.next();
    const socket = await waitForSocket(sockets, 0);
    socket.open();
    const subscribe = await waitForSent(socket, "starknet_subscribeEvents");
    expect((subscribe.params as { block_id: unknown }).block_id).toEqual({
      block_number: 10,
    });
    socket.message({
      jsonrpc: "2.0",
      id: 1,
      error: {
        code: 68,
        message: "Cannot go back more than 1024 blocks",
      },
    });

    await expect(next).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 11,
        },
      },
    });
    expect(eventRequests).toEqual([
      {
        from_block: { block_number: 0 },
        to_block: { block_number: 10 },
        chunk_size: 100,
      },
      {
        from_block: { block_number: 10 },
        to_block: { block_number: 12 },
        chunk_size: 100,
      },
    ]);

    await iterator.return?.(undefined);
  });

  it("skips invalid HTTP ranges when a reorg leaves accepted head before the reorg start", async () => {
    const sockets: MockWebSocket[] = [];
    const eventRequests: Array<Record<string, unknown>> = [];
    let latestCalls = 0;

    mockRpcFetch((request) => {
      if (request.method === "starknet_getBlockWithTxHashes") {
        latestCalls += 1;
        const blockNumber = latestCalls === 1 ? 12 : 10;
        return {
          block_hash: `0x${blockNumber.toString(16)}`,
          block_number: blockNumber,
          timestamp: 100 + blockNumber,
          transactions: [],
        };
      }

      if (request.method === "starknet_getEvents") {
        const filter = singleParam(request);
        eventRequests.push(filter);

        if (
          isBlockNumberParam(filter.from_block) &&
          isBlockNumberParam(filter.to_block) &&
          filter.from_block.block_number > filter.to_block.block_number
        ) {
          throw new Error("streamEvents should not query an invalid range");
        }

        return { events: [] };
      }

      throw new Error(`unexpected method ${request.method}`);
    });

    const iterator = streamEvents({
      url: RPC_URL,
      wsUrl: WS_URL,
      fromBlock: { block_number: 0 },
      webSocketFactory: mockWebSocketFactory(sockets),
    });

    const reorg = iterator.next();
    const socket1 = await waitForSocket(sockets, 0);
    socket1.open();
    await waitForSent(socket1, "starknet_subscribeEvents");
    socket1.message({ jsonrpc: "2.0", id: 1, result: "sub-1" });
    socket1.message(
      reorgNotification("sub-1", {
        starting_block_number: 12,
        starting_block_hash: "0x12",
        ending_block_number: 12,
        ending_block_hash: "0x12",
      }),
    );

    await expect(reorg).resolves.toMatchObject({
      done: false,
      value: {
        type: "reorg",
        reorg: {
          startingBlockNumber: 12,
        },
      },
    });

    const live = iterator.next();
    const socket2 = await waitForSocket(sockets, 1);
    socket2.open();
    const subscribe = await waitForSent(socket2, "starknet_subscribeEvents");
    expect((subscribe.params as { block_id: unknown }).block_id).toEqual({
      block_number: 10,
    });
    socket2.message({ jsonrpc: "2.0", id: 1, result: "sub-2" });
    socket2.message(
      eventNotification(
        "sub-2",
        rawEvent({ blockNumber: 12, transactionHash: "0x12" }),
      ),
    );

    await expect(live).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 12,
        },
      },
    });
    expect(eventRequests).toEqual([
      {
        from_block: { block_number: 0 },
        to_block: { block_number: 12 },
        chunk_size: 100,
      },
    ]);

    await iterator.return?.(undefined);
  });

  it("retries HTTP transport errors and resumes backfill", async () => {
    const sockets: MockWebSocket[] = [];
    const eventRequests: Array<Record<string, unknown>> = [];
    let latestCalls = 0;

    vi.spyOn(Math, "random").mockReturnValue(-1);
    mockRpcFetch(async (request) => {
      if (request.method === "starknet_getBlockWithTxHashes") {
        latestCalls += 1;

        if (latestCalls === 1) {
          return new Response("temporary unavailable", { status: 503 });
        }

        return {
          block_hash: "0x14",
          block_number: 20,
          timestamp: 120,
          transactions: [],
        };
      }

      if (request.method === "starknet_getEvents") {
        const filter = singleParam(request);
        eventRequests.push(filter);
        return {
          events: [rawEvent({ blockNumber: 20, transactionHash: "0x20" })],
        };
      }

      throw new Error(`unexpected method ${request.method}`);
    });

    const iterator = streamEvents({
      url: RPC_URL,
      wsUrl: WS_URL,
      fromBlock: { block_number: 0 },
      webSocketFactory: mockWebSocketFactory(sockets),
    });

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 20,
        },
      },
    });
    expect(latestCalls).toBe(2);
    expect(eventRequests).toEqual([
      {
        from_block: { block_number: 0 },
        to_block: { block_number: 20 },
        chunk_size: 100,
      },
    ]);

    await iterator.return?.(undefined);
  });

  it("rolls back a persisted pre-confirmed cursor ahead of accepted head before live resume", async () => {
    const sockets: MockWebSocket[] = [];
    const methods: string[] = [];

    mockRpcFetch((request) => {
      methods.push(request.method);

      if (request.method === "starknet_getBlockWithTxHashes") {
        return {
          block_hash: "0x10",
          block_number: 10,
          timestamp: 110,
          transactions: [],
        };
      }

      if (request.method === "starknet_getEvents") {
        throw new Error("streamEvents should not query an invalid HTTP range");
      }

      throw new Error(`unexpected method ${request.method}`);
    });

    const iterator = streamEvents({
      url: RPC_URL,
      wsUrl: WS_URL,
      cursor: cursor(11, "0xaaa", 4, 2),
      webSocketFactory: mockWebSocketFactory(sockets),
    });

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: {
        type: "reorg",
        reorg: {
          startingBlockNumber: 11,
          endingBlockNumber: 11,
          synthetic: true,
        },
        rollbackCursor: {
          blockNumber: 11,
          transactionIndex: -1,
          transactionHash: "0x0",
          eventIndex: -1,
        },
      },
    });
    expect(methods).toEqual(["starknet_getBlockWithTxHashes"]);

    const live = iterator.next();
    const socket = await waitForSocket(sockets, 0);
    socket.open();
    const subscribe = await waitForSent(socket, "starknet_subscribeEvents");
    expect((subscribe.params as { block_id: unknown }).block_id).toEqual({
      block_number: 10,
    });
    socket.message({ jsonrpc: "2.0", id: 1, result: "sub-1" });
    socket.message(
      eventNotification(
        "sub-1",
        rawEvent({
          blockNumber: 11,
          transactionHash: "0xbbb",
          transactionIndex: 4,
          eventIndex: 2,
          finalityStatus: "PRE_CONFIRMED",
        }),
      ),
    );

    await expect(live).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 11,
          transactionIndex: 4,
          transactionHash: normalizeFelt("0xbbb"),
          eventIndex: 2,
        },
      },
    });

    await iterator.return?.(undefined);
  });

  it("replays a persisted pre-confirmed cursor block after accepted head catches up", async () => {
    const sockets: MockWebSocket[] = [];
    const eventRequests: Array<Record<string, unknown>> = [];

    mockRpcFetch((request) => {
      if (request.method === "starknet_getBlockWithTxHashes") {
        return {
          block_hash: "0x0b",
          block_number: 11,
          timestamp: 111,
          transactions: [],
        };
      }

      if (request.method === "starknet_getEvents") {
        const filter = singleParam(request);
        eventRequests.push(filter);
        return {
          events: [
            rawEvent({
              blockNumber: 11,
              transactionHash: "0xbbb",
              transactionIndex: 4,
              eventIndex: 2,
              finalityStatus: "ACCEPTED_ON_L2",
            }),
          ],
        };
      }

      throw new Error(`unexpected method ${request.method}`);
    });

    const iterator = streamEvents({
      url: RPC_URL,
      wsUrl: WS_URL,
      cursor: cursor(11, "0xaaa", 4, 2),
      cursorFinalityStatus: "PRE_CONFIRMED",
      webSocketFactory: mockWebSocketFactory(sockets),
    });

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: {
        type: "reorg",
        reorg: {
          startingBlockNumber: 11,
          endingBlockNumber: 11,
          synthetic: true,
        },
        rollbackCursor: {
          blockNumber: 11,
          transactionIndex: -1,
          transactionHash: "0x0",
          eventIndex: -1,
        },
      },
    });

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 11,
          transactionIndex: 4,
          transactionHash: normalizeFelt("0xbbb"),
          eventIndex: 2,
        },
      },
    });
    expect(eventRequests).toEqual([
      {
        from_block: { block_number: 11 },
        to_block: { block_number: 11 },
        chunk_size: 100,
      },
    ]);
    expect(sockets).toHaveLength(0);

    await iterator.return?.(undefined);
  });

  it("skips conservative cursor-block replay when the persisted cursor is accepted", async () => {
    const sockets: MockWebSocket[] = [];
    const eventRequests: Array<Record<string, unknown>> = [];

    mockRpcFetch((request) => {
      if (request.method === "starknet_getBlockWithTxHashes") {
        return {
          block_hash: "0x0b",
          block_number: 11,
          timestamp: 111,
          transactions: [],
        };
      }

      if (request.method === "starknet_getEvents") {
        const filter = singleParam(request);
        eventRequests.push(filter);
        return {
          events: [
            rawEvent({
              blockNumber: 11,
              transactionHash: "0xaaa",
              transactionIndex: 4,
              eventIndex: 2,
            }),
            rawEvent({
              blockNumber: 11,
              transactionHash: "0xccc",
              transactionIndex: 5,
              eventIndex: 0,
            }),
          ],
        };
      }

      throw new Error(`unexpected method ${request.method}`);
    });

    const iterator = streamEvents({
      url: RPC_URL,
      wsUrl: WS_URL,
      cursor: cursor(11, "0xaaa", 4, 2),
      cursorFinalityStatus: "ACCEPTED_ON_L2",
      webSocketFactory: mockWebSocketFactory(sockets),
    });

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: {
        type: "event",
        cursor: {
          blockNumber: 11,
          transactionIndex: 5,
          transactionHash: normalizeFelt("0xccc"),
          eventIndex: 0,
        },
      },
    });
    expect(eventRequests).toEqual([
      {
        from_block: { block_number: 11 },
        to_block: { block_number: 11 },
        chunk_size: 100,
      },
    ]);

    await iterator.return?.(undefined);
  });
});

type JsonRpcRequest = {
  method: string;
  params?: unknown[];
};

function singleParam(request: JsonRpcRequest): Record<string, unknown> {
  const params = request.params;
  if (!Array.isArray(params) || params.length !== 1) {
    throw new Error("expected one positional JSON-RPC param");
  }

  const [param] = params;
  if (typeof param !== "object" || param === null || Array.isArray(param)) {
    throw new Error("expected positional JSON-RPC param object");
  }

  return param as Record<string, unknown>;
}

function isBlockNumberParam(value: unknown): value is { block_number: number } {
  return typeof value === "object" && value !== null && "block_number" in value;
}

function rpcBlock(blockNumber: number) {
  const parentBlockNumber = Math.max(0, blockNumber - 1);
  return {
    block_hash: `0x${blockNumber.toString(16)}`,
    parent_hash: `0x${parentBlockNumber.toString(16)}`,
    block_number: blockNumber,
    timestamp: 100 + blockNumber,
    transactions: [],
  };
}

function cursor(
  blockNumber: number,
  transactionHash = "0x1",
  transactionIndex = 0,
  eventIndex = 0,
): EventCursor {
  return { blockNumber, transactionIndex, transactionHash, eventIndex };
}

function rawEvent({
  blockNumber = 1,
  blockHash,
  transactionHash = "0x1",
  transactionIndex = 0,
  eventIndex = 0,
  fromAddress = "0xaaa",
  keys = ["0x111"],
  data = ["0x222"],
  finalityStatus = "ACCEPTED_ON_L2",
}: {
  blockNumber?: number;
  blockHash?: string;
  transactionHash?: string;
  transactionIndex?: number;
  eventIndex?: number;
  fromAddress?: string;
  keys?: string[];
  data?: string[];
  finalityStatus?: RpcEvent["finality_status"];
} = {}): RpcEvent {
  const event: RpcEvent = {
    block_number: blockNumber,
    transaction_hash: transactionHash,
    transaction_index: transactionIndex,
    event_index: eventIndex,
    from_address: fromAddress,
    keys,
    data,
    finality_status: finalityStatus,
  };

  if (blockHash !== undefined) {
    event.block_hash = blockHash;
  }

  return event;
}

function eventNotification(subscriptionId: string, event: RpcEvent) {
  return {
    jsonrpc: "2.0",
    method: "starknet_subscriptionEvents",
    params: {
      subscription_id: subscriptionId,
      result: event,
    },
  };
}

function reorgNotification(
  subscriptionId: string,
  reorg: {
    starting_block_number: number;
    starting_block_hash: string;
    ending_block_number: number;
    ending_block_hash: string;
  },
) {
  return {
    jsonrpc: "2.0",
    method: "starknet_subscriptionReorg",
    params: {
      subscription_id: subscriptionId,
      result: reorg,
    },
  };
}

function mockRpcFetch(
  handler: (request: JsonRpcRequest) => unknown | Promise<unknown>,
): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as JsonRpcRequest & {
        id?: number | string;
      };
      const result = await handler(request);

      if (result instanceof Response) {
        return result;
      }

      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: request.id ?? 1,
          result,
        }),
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );
    }),
  );
}

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const values: T[] = [];
  for await (const value of iterable) {
    values.push(value);
  }
  return values;
}

function mockWebSocketFactory(sockets: MockWebSocket[]) {
  return (url: string) => {
    const socket = new MockWebSocket(url);
    sockets.push(socket);
    return socket;
  };
}

class MockWebSocket {
  readyState = 0;
  sent: Array<Record<string, unknown>> = [];
  readonly #listeners = new Map<string, Set<(event: unknown) => void>>();

  constructor(readonly url: string) {}

  send(data: string): void {
    this.sent.push(JSON.parse(data) as Record<string, unknown>);
  }

  close(): void {
    if (this.readyState === 3) {
      return;
    }

    this.readyState = 3;
    this.dispatch("close", {});
  }

  addEventListener(
    type: "open" | "message" | "error" | "close",
    listener: (event: unknown) => void,
  ): void {
    const listeners = this.#listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.#listeners.set(type, listeners);
  }

  removeEventListener(
    type: "open" | "message" | "error" | "close",
    listener: (event: unknown) => void,
  ): void {
    this.#listeners.get(type)?.delete(listener);
  }

  open(): void {
    this.readyState = 1;
    this.dispatch("open", {});
  }

  message(value: unknown): void {
    this.dispatch("message", { data: JSON.stringify(value) });
  }

  rawMessage(data: unknown): void {
    this.dispatch("message", { data });
  }

  private dispatch(type: string, event: unknown): void {
    for (const listener of this.#listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

async function waitForSocket(
  sockets: MockWebSocket[],
  index: number,
): Promise<MockWebSocket> {
  await waitFor(() => sockets[index] !== undefined);
  return sockets[index];
}

async function waitForSent(
  socket: MockWebSocket,
  method: string,
): Promise<Record<string, unknown>> {
  await waitFor(() => socket.sent.some((message) => message.method === method));
  const message = socket.sent.find((message) => message.method === method);
  if (!message) {
    throw new Error(`missing sent message ${method}`);
  }

  return message;
}

async function waitFor(predicate: () => boolean): Promise<void> {
  const startedAt = Date.now();

  while (!predicate()) {
    if (Date.now() - startedAt > 1_000) {
      throw new Error("timed out waiting for condition");
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

async function flushTasks(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
