import { hexToBytes, toHex } from "viem";

import type { Codec, CodecProto, CodecType } from "./codec";
import * as proto from "./proto";

/** Bytes encoded as a 0x-prefixed hex string. */
export type Bytes = `0x${string}`;

export const BytesFromUint8Array: Codec<
  `0x${string}` | undefined,
  Uint8Array | undefined
> = {
  decode(value) {
    if (!value || value?.length === 0) {
      return undefined;
    }
    return toHex(value);
  },
  encode(value) {
    if (value === undefined) {
      return new Uint8Array(0);
    }
    return hexToBytes(value);
  },
};

type _CursorApp = {
  orderKey: bigint;
  uniqueKey?: Bytes | undefined;
};

type _CursorProto = proto.stream.Cursor;

/** Represent a position in the stream. */
export const Cursor: Codec<_CursorApp, _CursorProto> = {
  decode(value) {
    const { orderKey, uniqueKey } = value;
    if (orderKey === undefined) {
      throw new Error("Cursor | orderKey is undefined");
    }
    return {
      orderKey,
      uniqueKey: BytesFromUint8Array.decode(uniqueKey),
    };
  },
  encode(value) {
    const { orderKey, uniqueKey } = value;
    return {
      orderKey,
      uniqueKey: BytesFromUint8Array.encode(uniqueKey),
    };
  },
};
/** The Cursor protobuf representation. */
export type CursorProto = CodecProto<typeof Cursor>;
export type Cursor = CodecType<typeof Cursor>;
export const createCursor = (props: Cursor) => props;

export const cursorToProto = Cursor.encode;
export const cursorFromProto = Cursor.decode;

export const CursorFromBytes: Codec<Cursor, Uint8Array> = {
  encode(value) {
    const { orderKey, uniqueKey } = value;
    return proto.stream.Cursor.encode({
      orderKey,
      uniqueKey: BytesFromUint8Array.encode(uniqueKey),
    }).finish();
  },
  decode(value) {
    const { orderKey, uniqueKey } = proto.stream.Cursor.decode(value);
    if (orderKey === undefined) {
      throw new Error("Cursor | orderKey is undefined");
    }
    return {
      orderKey,
      uniqueKey: BytesFromUint8Array.decode(uniqueKey),
    };
  },
};

export const cursorToBytes = CursorFromBytes.encode;
export const cursorFromBytes = CursorFromBytes.decode;

export function isCursor(value: unknown): value is Cursor {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const { orderKey, uniqueKey } = value as Cursor;

  return (
    typeof orderKey === "bigint" &&
    (uniqueKey === null ||
      uniqueKey === undefined ||
      (typeof uniqueKey === "string" && uniqueKey.startsWith("0x")))
  );
}

/** Normalize a cursor.
 *
 * The challenge is that the `Cursor` validator expects `uniqueKey` to be either a `0x${string}`
 * or not present at all. Setting the field to `undefined` will result in a validation error.
 *
 * @param cursor The cursor to normalize
 */
export function normalizeCursor(cursor: {
  orderKey: bigint;
  uniqueKey: string | null;
}): Cursor {
  if (cursor.uniqueKey !== null && cursor.uniqueKey.length > 0) {
    const uniqueKey = cursor.uniqueKey as `0x${string}`;
    return {
      orderKey: BigInt(cursor.orderKey),
      uniqueKey,
    };
  }

  return {
    orderKey: BigInt(cursor.orderKey),
  };
}
