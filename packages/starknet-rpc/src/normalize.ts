import type {
  BlockId,
  EventFilter,
  Felt,
  NormalizedEvent,
  NormalizedReorg,
  RpcEvent,
  RpcReorg,
} from "./types";

const FELT_HEX_LENGTH = 64;
const EVENT_CURSOR_FIELD_REQUIREMENT =
  "This package requires Starknet event payloads to include block_number, transaction_index, and event_index for duplicate-safe cursoring. Use a Starknet JSON-RPC >= 0.10 endpoint that provides these fields.";

export class StarknetEventCursorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StarknetEventCursorError";
  }
}

export function normalizeFelt(value: Felt, field = "felt"): Felt {
  if (typeof value !== "string") {
    throw new Error(`${field} must be a 0x-prefixed hex string`);
  }

  if (!value.startsWith("0x") && !value.startsWith("0X")) {
    throw new Error(`${field} must be a 0x-prefixed hex string`);
  }

  const hex = value.slice(2).toLowerCase();

  if (hex.length === 0) {
    throw new Error(`${field} must contain at least one hex digit`);
  }

  if (!/^[0-9a-f]+$/.test(hex)) {
    throw new Error(`${field} must contain only hex digits`);
  }

  if (hex.length > FELT_HEX_LENGTH) {
    throw new Error(`${field} exceeds ${FELT_HEX_LENGTH} hex digits`);
  }

  return `0x${hex.padStart(FELT_HEX_LENGTH, "0")}`;
}

export function normalizeEvent(raw: RpcEvent): NormalizedEvent {
  const blockNumber = requiredNonNegativeInteger(
    raw.block_number,
    "event.block_number",
    EVENT_CURSOR_FIELD_REQUIREMENT,
  );
  const transactionHash = normalizeFelt(
    requiredFelt(raw.transaction_hash, "event.transaction_hash"),
    "event.transaction_hash",
  );
  const eventIndex = requiredNonNegativeInteger(
    raw.event_index,
    "event.event_index",
    EVENT_CURSOR_FIELD_REQUIREMENT,
  );
  const transactionIndex = requiredNonNegativeInteger(
    raw.transaction_index,
    "event.transaction_index",
    EVENT_CURSOR_FIELD_REQUIREMENT,
  );

  const blockHash =
    raw.block_hash === undefined
      ? undefined
      : normalizeFelt(raw.block_hash, "event.block_hash");

  return {
    cursor: {
      blockNumber,
      transactionIndex,
      transactionHash,
      eventIndex,
    },
    fromAddress: normalizeFelt(
      requiredFelt(raw.from_address, "event.from_address"),
      "event.from_address",
    ),
    keys: requiredFeltArray(raw.keys, "event.keys"),
    data: requiredFeltArray(raw.data, "event.data"),
    blockHash,
    blockNumber,
    transactionHash,
    transactionIndex,
    eventIndex,
    finalityStatus: raw.finality_status,
    raw,
  };
}

export function normalizeReorg(raw: RpcReorg): NormalizedReorg {
  return {
    startingBlockNumber: requiredNonNegativeInteger(
      raw.starting_block_number,
      "reorg.starting_block_number",
    ),
    startingBlockHash: normalizeFelt(
      requiredFelt(raw.starting_block_hash, "reorg.starting_block_hash"),
      "reorg.starting_block_hash",
    ),
    endingBlockNumber: requiredNonNegativeInteger(
      raw.ending_block_number,
      "reorg.ending_block_number",
    ),
    endingBlockHash: normalizeFelt(
      requiredFelt(raw.ending_block_hash, "reorg.ending_block_hash"),
      "reorg.ending_block_hash",
    ),
    raw,
  };
}

export function matchesEventFilter(
  event: NormalizedEvent | RpcEvent,
  filter: EventFilter,
): boolean {
  if (!matchesBlockFilter(event, filter.fromBlock, filter.toBlock)) {
    return false;
  }

  if (filter.addresses && filter.addresses.length > 0) {
    const eventAddress = normalizeFelt(getEventAddress(event), "event address");
    const addresses = new Set(
      filter.addresses.map((address) =>
        normalizeFelt(address, "filter.addresses"),
      ),
    );

    if (!addresses.has(eventAddress)) {
      return false;
    }
  }

  if (filter.keys && filter.keys.length > 0) {
    for (let position = 0; position < filter.keys.length; position++) {
      const expectedKeys = filter.keys[position];

      if (!expectedKeys || expectedKeys.length === 0) {
        continue;
      }

      const eventKey = event.keys[position];
      if (eventKey === undefined) {
        return false;
      }

      const normalizedEventKey = normalizeFelt(
        eventKey,
        `event.keys[${position}]`,
      );
      const normalizedExpectedKeys = new Set(
        expectedKeys.map((key) =>
          normalizeFelt(key, `filter.keys[${position}]`),
        ),
      );

      if (!normalizedExpectedKeys.has(normalizedEventKey)) {
        return false;
      }
    }
  }

  return true;
}

function requiredFelt(value: unknown, field: string): Felt {
  if (typeof value !== "string") {
    throw new Error(`${field} is required`);
  }

  return value;
}

function requiredFeltArray(value: unknown, field: string): Felt[] {
  if (!Array.isArray(value)) {
    throw new Error(`${field} is required`);
  }

  return value.map((felt, index) =>
    normalizeFelt(
      requiredFelt(felt, `${field}[${index}]`),
      `${field}[${index}]`,
    ),
  );
}

function requiredNonNegativeInteger(
  value: unknown,
  field: string,
  requirement?: string,
): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    const message = `${field} is required and must be a non-negative integer${
      requirement ? `. ${requirement}` : ""
    }`;

    if (requirement) {
      throw new StarknetEventCursorError(message);
    }

    throw new Error(message);
  }

  return value;
}

function getEventAddress(event: NormalizedEvent | RpcEvent): Felt {
  return isNormalizedEvent(event) ? event.fromAddress : event.from_address;
}

function getEventBlockNumber(event: NormalizedEvent | RpcEvent): number {
  return isNormalizedEvent(event)
    ? event.blockNumber
    : requiredNonNegativeInteger(event.block_number, "event.block_number");
}

function getEventBlockHash(
  event: NormalizedEvent | RpcEvent,
): Felt | undefined {
  const blockHash = isNormalizedEvent(event)
    ? event.blockHash
    : event.block_hash;
  return blockHash === undefined
    ? undefined
    : normalizeFelt(blockHash, "event.block_hash");
}

function isNormalizedEvent(
  event: NormalizedEvent | RpcEvent,
): event is NormalizedEvent {
  return "fromAddress" in event;
}

function matchesBlockFilter(
  event: NormalizedEvent | RpcEvent,
  fromBlock?: BlockId,
  toBlock?: BlockId,
): boolean {
  if (isBlockNumberId(fromBlock) || isBlockNumberId(toBlock)) {
    const blockNumber = getEventBlockNumber(event);

    if (isBlockNumberId(fromBlock) && blockNumber < fromBlock.block_number) {
      return false;
    }

    if (isBlockNumberId(toBlock) && blockNumber > toBlock.block_number) {
      return false;
    }
  }

  if (isBlockHashId(fromBlock) || isBlockHashId(toBlock)) {
    const blockHash = getEventBlockHash(event);

    if (
      isBlockHashId(fromBlock) &&
      blockHash !== normalizeFelt(fromBlock.block_hash, "filter.fromBlock")
    ) {
      return false;
    }

    if (
      isBlockHashId(toBlock) &&
      blockHash !== normalizeFelt(toBlock.block_hash, "filter.toBlock")
    ) {
      return false;
    }
  }

  return true;
}

function isBlockNumberId(
  blockId: BlockId | undefined,
): blockId is { block_number: number } {
  return (
    typeof blockId === "object" && blockId !== null && "block_number" in blockId
  );
}

function isBlockHashId(
  blockId: BlockId | undefined,
): blockId is { block_hash: Felt } {
  return (
    typeof blockId === "object" && blockId !== null && "block_hash" in blockId
  );
}
