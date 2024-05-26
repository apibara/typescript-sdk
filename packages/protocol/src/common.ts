import { hexToBytes, toHex } from "viem";

import * as proto from "./proto";

export type Bytes = `0x${string}`;

export type Cursor = {
  orderKey: bigint;
  uniqueKey?: Bytes;
};

export const Cursor = {
  toJSON(message: proto.common.Cursor): Cursor {
    const uniqueKey =
      message.uniqueKey.length > 0 ? toHex(message.uniqueKey) : undefined;
    return {
      orderKey: message.orderKey ?? 0n,
      uniqueKey,
    };
  },

  fromJSON(cursor: Cursor): proto.common.Cursor {
    const uniqueKey = cursor.uniqueKey
      ? hexToBytes(cursor.uniqueKey)
      : new Uint8Array(0);

    return {
      orderKey: cursor.orderKey,
      uniqueKey,
    };
  },
};

export type StatusRequest = {};

export type StatusResponse = {
  currentHead?: Cursor;
  lastIngested?: Cursor;
};

export const StatusResponse = {
  toJSON(message: proto.common.StatusResponse): StatusResponse {
    const currentHead = message.currentHead
      ? Cursor.toJSON(message.currentHead)
      : undefined;
    const lastIngested = message.lastIngested
      ? Cursor.toJSON(message.lastIngested)
      : undefined;

    return {
      currentHead,
      lastIngested,
    };
  },
};
