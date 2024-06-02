import { hexToBytes, toHex } from "viem";
import { Option } from "effect";
import { Schema } from "@effect/schema";

import * as proto from "./proto";

/** Bytes encoded as a 0x-prefixed hex string. */
export const Bytes = Schema.TemplateLiteral(
  Schema.Literal("0x"),
  Schema.String,
);

export type Bytes = typeof Bytes.Type;

export const BytesFromUint8Array = Schema.requiredToOptional(
  Schema.Uint8ArrayFromSelf,
  Bytes,
  {
    decode(value) {
      if (value.length === 0) {
        return Option.none();
      }
      return Option.some(toHex(value));
    },
    encode(value) {
      return value.pipe(
        Option.map(hexToBytes),
        Option.getOrElse(() => new Uint8Array(0)),
      );
    },
  },
);

/** Represent a position in the stream. */
export const Cursor = Schema.Struct({
  /** The block number. */
  orderKey: Schema.BigIntFromSelf,
  /** The block hash, if any. */
  uniqueKey: BytesFromUint8Array,
});

/** The Cursor protobuf representation. */
export type CursorProto = typeof Cursor.Encoded;
export type Cursor = typeof Cursor.Type;

export const cursorToProto = Schema.encodeSync(Cursor);
export const cursorFromProto = Schema.decodeSync(Cursor);

export const CursorFromBytes = Schema.transform(
  Schema.Uint8ArrayFromSelf,
  Cursor,
  {
    decode(value) {
      return proto.common.Cursor.decode(value);
    },
    encode(value) {
      return proto.common.Cursor.encode(value).finish();
    },
  },
);

export const cursorToBytes = Schema.encodeSync(CursorFromBytes);
export const cursorFromBytes = Schema.decodeSync(CursorFromBytes);
