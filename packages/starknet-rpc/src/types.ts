export type Felt = string;

export type BlockTag = "latest" | "l1_accepted" | "pre_confirmed";

export type BlockId =
  | BlockTag
  | {
      block_number: number;
    }
  | {
      block_hash: Felt;
    };

export type SubscriptionBlockId =
  | "latest"
  | {
      block_number: number;
    }
  | {
      block_hash: Felt;
    };

export type FinalityStatus =
  | "ACCEPTED_ON_L2"
  | "ACCEPTED_ON_L1"
  | "PRE_CONFIRMED";

export type SubscriptionFinalityStatus = "ACCEPTED_ON_L2" | "PRE_CONFIRMED";

export interface EventCursor {
  blockNumber: number;
  transactionIndex: number;
  transactionHash: Felt;
  eventIndex: number;
}

export interface RpcEvent {
  from_address: Felt;
  keys: Felt[];
  data: Felt[];
  block_hash?: Felt;
  block_number?: number;
  transaction_hash: Felt;
  transaction_index?: number;
  event_index?: number;
  finality_status?: FinalityStatus;
}

export interface NormalizedEvent {
  cursor: EventCursor;
  fromAddress: Felt;
  keys: Felt[];
  data: Felt[];
  blockHash?: Felt;
  blockNumber: number;
  transactionHash: Felt;
  transactionIndex: number;
  eventIndex: number;
  finalityStatus?: FinalityStatus;
  raw: RpcEvent;
}

export interface RpcReorg {
  starting_block_number: number;
  starting_block_hash: Felt;
  ending_block_number: number;
  ending_block_hash: Felt;
}

export interface NormalizedReorg {
  startingBlockNumber: number;
  startingBlockHash: Felt;
  endingBlockNumber: number;
  endingBlockHash: Felt;
  synthetic?: boolean;
  raw: RpcReorg;
}

export type EventMessage = {
  type: "event";
  event: NormalizedEvent;
  cursor: EventCursor;
};

export type ReorgMessage = {
  type: "reorg";
  reorg: NormalizedReorg;
  rollbackCursor: EventCursor;
};

export type StreamMessage = EventMessage | ReorgMessage;

export interface EventFilter {
  fromBlock?: BlockId;
  toBlock?: BlockId;
  addresses?: Felt[];
  keys?: Felt[][];
  chunkSize?: number;
}

export interface GetEventsOptions extends EventFilter {
  url: string;
  continuationToken?: string;
  signal?: AbortSignal;
}

export interface GetEventsPage {
  events: NormalizedEvent[];
  continuationToken?: string;
}

export interface BackfillEventsOptions extends EventFilter {
  url: string;
  cursor?: EventCursor;
  continuationToken?: string;
  signal?: AbortSignal;
}

export interface SubscribeEventsOptions {
  url: string;
  blockId?: SubscriptionBlockId;
  addresses?: Felt[];
  keys?: Felt[][];
  finalityStatus?: SubscriptionFinalityStatus;
  cursor?: EventCursor;
  reconnect?: boolean | SubscribeReconnectOptions;
  /** Close and reconnect when no WebSocket frames are received for this many milliseconds. Set to 0 to disable. */
  idleTimeoutMs?: number;
  /** Maximum queued WebSocket messages waiting for the consumer before the subscription is closed. */
  maxQueueSize?: number;
  signal?: AbortSignal;
  webSocketFactory?: WebSocketFactory;
}

export interface SubscribeReconnectOptions {
  enabled?: boolean;
  minDelayMs?: number;
  maxDelayMs?: number;
  /** Maximum reconnect attempts after a failed or closed connection. Omit for no limit. */
  maxAttempts?: number;
}

export interface EventSubscription extends AsyncIterable<StreamMessage> {
  unsubscribe(): Promise<void>;
}

export interface StreamEventsOptions extends Omit<EventFilter, "toBlock"> {
  url: string;
  wsUrl: string;
  cursor?: EventCursor;
  /** Finality of the persisted cursor, when known. Unknown cursors are replayed conservatively for pre-confirmed live streams. */
  cursorFinalityStatus?: FinalityStatus;
  /** Applies to the live WebSocket subscription. Historical backfill uses accepted events. */
  finalityStatus?: SubscriptionFinalityStatus;
  /** Close and reconnect when no WebSocket frames are received for this many milliseconds. Set to 0 to disable. */
  idleTimeoutMs?: number;
  /** Maximum queued WebSocket messages waiting for the consumer before the subscription is closed. */
  maxQueueSize?: number;
  signal?: AbortSignal;
  webSocketFactory?: WebSocketFactory;
}

export interface BlockMetadata {
  blockNumber: number;
  blockHash: Felt;
  timestamp: number;
}

export interface BlockCacheOptions {
  url: string;
  signal?: AbortSignal;
}

export interface RpcWebSocket {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener(
    type: "open" | "message" | "error" | "close",
    listener: (event: unknown) => void,
    options?: unknown,
  ): void;
  removeEventListener?(
    type: "open" | "message" | "error" | "close",
    listener: (event: unknown) => void,
    options?: unknown,
  ): void;
  readyState?: number;
}

export type WebSocketFactory = (url: string) => RpcWebSocket;
