import { normalizeFelt } from "./normalize";
import type { EventCursor, NormalizedEvent } from "./types";

export function compareEventCursor(a: EventCursor, b: EventCursor): number {
  if (a.blockNumber !== b.blockNumber) {
    return a.blockNumber < b.blockNumber ? -1 : 1;
  }

  if (a.transactionIndex !== b.transactionIndex) {
    return a.transactionIndex < b.transactionIndex ? -1 : 1;
  }

  if (a.eventIndex !== b.eventIndex) {
    return a.eventIndex < b.eventIndex ? -1 : 1;
  }

  return 0;
}

export function cursorEquals(a: EventCursor, b: EventCursor): boolean {
  return compareEventCursor(a, b) === 0;
}

export function eventCursorKey(cursor: EventCursor): string {
  return [
    cursor.blockNumber,
    normalizeFelt(cursor.transactionHash, "cursor.transactionHash"),
    cursor.eventIndex,
  ].join(":");
}

export function eventVersionKey(event: NormalizedEvent): string {
  return [
    event.finalityStatus ?? "",
    event.blockHash ?? "",
    event.fromAddress,
    event.keys.join(","),
    event.data.join(","),
  ].join(":");
}

export function cursorBeforeBlock(blockNumber: number): EventCursor {
  return {
    blockNumber,
    transactionIndex: -1,
    transactionHash: "0x0",
    eventIndex: -1,
  };
}

export function isCursorBeforeBlock(cursor: EventCursor): boolean {
  return cursor.transactionIndex < 0 || cursor.eventIndex < 0;
}
