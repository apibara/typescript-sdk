# @apibara/starknet-rpc

Starknet JSON-RPC event indexing helpers for Apibara indexers.

This package supports:

- historical event backfill with `starknet_getEvents` over HTTP
- live event indexing with `starknet_subscribeEvents` over WebSocket
- explicit event cursors
- reorg notifications and rollback cursors
- an Apibara `RpcStreamConfig` adapter for accepted event blocks

## Requirements

Use a Starknet JSON-RPC v0.10 or newer endpoint, for example `/rpc/v0_10`
and `/ws/rpc/v0_10`.

The RPC node must include `block_number`, `transaction_index`, and
`event_index` in event payloads. These fields are required for duplicate-safe
cursoring and resume behavior.

The package targets modern Node.js runtimes with global `fetch` support. A
default Node WebSocket client is included, and custom transports can be provided
with `webSocketFactory`.

## Recommended Usage

Use `streamEvents` when you want historical backfill followed by live indexing:

```ts
import { streamEvents } from "@apibara/starknet-rpc";

for await (const message of streamEvents({
  url: process.env.STARKNET_RPC_URL!,
  wsUrl: process.env.STARKNET_WS_URL!,
  fromBlock: { block_number: 0 },
  cursor: await loadCursor(),
  cursorFinalityStatus: await loadCursorFinalityStatus(),
  addresses: ["0x1234"],
  keys: [["0xabcdef"]],
})) {
  if (message.type === "reorg") {
    await db.transaction(async (tx) => {
      await rollbackFrom(tx, message.reorg.startingBlockNumber);
      await saveCursor(tx, message.rollbackCursor);
    });
    continue;
  }

  await db.transaction(async (tx) => {
    await insertEvent(tx, message.event);
    await saveCursor(tx, message.cursor);
  });
}
```

`streamEvents` backfills accepted events over HTTP, then switches to a live
WebSocket subscription. Live subscriptions use `PRE_CONFIRMED` finality by
default for low-latency indexing.

## HTTP Backfill

Use `backfillEvents` for bounded or standalone historical indexing:

```ts
import { backfillEvents } from "@apibara/starknet-rpc";

for await (const message of backfillEvents({
  url: process.env.STARKNET_RPC_URL!,
  fromBlock: { block_number: 0 },
  toBlock: "latest",
  addresses: ["0x1234"],
  keys: [["0xabcdef"]],
  cursor: await loadCursor(),
  chunkSize: 1024,
})) {
  await db.transaction(async (tx) => {
    await insertEvent(tx, message.event);
    await saveCursor(tx, message.cursor);
  });
}
```

## Live Subscriptions

Use `subscribeEvents` when you only need the WebSocket subscription layer:

```ts
import { subscribeEvents } from "@apibara/starknet-rpc";

const subscription = subscribeEvents({
  url: process.env.STARKNET_WS_URL!,
  blockId: "latest",
  addresses: ["0x1234"],
  keys: [["0xabcdef"]],
  idleTimeoutMs: 60_000,
  maxQueueSize: 10_000,
});

try {
  for await (const message of subscription) {
    if (message.type === "reorg") {
      await db.transaction(async (tx) => {
        await rollbackFrom(tx, message.reorg.startingBlockNumber);
        await saveCursor(tx, message.rollbackCursor);
      });
      continue;
    }

    await db.transaction(async (tx) => {
      await insertEvent(tx, message.event);
      await saveCursor(tx, message.cursor);
    });
  }
} finally {
  await subscription.unsubscribe();
}
```

## Apibara RPC Stream

`StarknetRpcStream` implements Apibara's `RpcStreamConfig` interface for
accepted event blocks fetched over HTTP:

```ts
import { defineIndexer } from "apibara/indexer";
import { StarknetRpcStream } from "@apibara/starknet-rpc";

export default defineIndexer(
  new StarknetRpcStream({
    url: process.env.STARKNET_RPC_URL!,
  }),
)({
  filter: {
    addresses: ["0x1234"],
    keys: [["0xabcdef"]],
  },
  async transform({ block }) {
    for (const event of block.events) {
      // Persist accepted events.
    }
  },
});
```

Use `streamEvents` instead when you need the pre-confirmed WebSocket path.

## Cursor and Reorg Contract

Persist the cursor in the same transaction as the rows derived from the event.

Cursor ordering uses:

```text
block_number + transaction_index + event_index
```

Stable event identity uses:

```text
block_number + transaction_hash + event_index
```

`event_index` is scoped to the transaction, not the whole block.

For pre-confirmed indexing, persist cursor finality and pass it back as
`cursorFinalityStatus` on restart. This lets the stream resume without skipping
accepted replacement events after reorgs.

When receiving a reorg message, delete or roll back all chain-derived rows where:

```sql
block_number >= starting_block_number
```

Then persist `message.rollbackCursor` in the same transaction.
