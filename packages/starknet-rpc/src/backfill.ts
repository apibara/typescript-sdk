import { compareEventCursor } from "./cursor";
import { getEvents } from "./http";
import type { BackfillEventsOptions, BlockId, EventMessage } from "./types";

const DEFAULT_BACKFILL_CHUNK_SIZE = 100;

export async function* backfillEvents(
  options: BackfillEventsOptions,
): AsyncGenerator<EventMessage, void, unknown> {
  const fromBlock = getStartingBlock(options);
  let continuationToken = options.cursor
    ? undefined
    : options.continuationToken;

  do {
    const page = await getEvents({
      url: options.url,
      fromBlock,
      toBlock: options.toBlock ?? "latest",
      addresses: options.addresses,
      keys: options.keys,
      chunkSize: options.chunkSize ?? DEFAULT_BACKFILL_CHUNK_SIZE,
      continuationToken,
      signal: options.signal,
    });

    for (const event of page.events) {
      if (
        options.cursor &&
        compareEventCursor(event.cursor, options.cursor) <= 0
      ) {
        continue;
      }

      yield {
        type: "event",
        event,
        cursor: event.cursor,
      };
    }

    continuationToken = page.continuationToken;
  } while (continuationToken !== undefined);
}

function getStartingBlock(options: BackfillEventsOptions): BlockId | undefined {
  if (options.cursor) {
    return { block_number: options.cursor.blockNumber };
  }

  return options.fromBlock;
}
