import { hexToBytes, toHex } from "viem";
import { Option } from "effect";
import { Schema } from "@effect/schema";
import type { ParseOptions } from "@effect/schema/AST";

import * as proto from "./proto";

export const Bytes = Schema.TemplateLiteral(
  Schema.Literal("0x"),
  Schema.String,
);

const BytesFromUint8Array = Schema.requiredToOptional(
  Schema.Uint8ArrayFromSelf,
  Bytes,
  {
    encode(value) {
      return value.pipe(
        Option.map(hexToBytes),
        Option.getOrElse(() => new Uint8Array(0)),
      );
    },
    decode(value) {
      if (value.length === 0) {
        return Option.none();
      }
      return Option.some(toHex(value));
    },
  },
);

export const CursorMessage = Schema.Struct({
  orderKey: Schema.BigIntFromSelf,
  uniqueKey: Schema.Uint8ArrayFromSelf,
});

export class Cursor extends Schema.Class<Cursor>("Cursor")({
  orderKey: Schema.BigIntFromSelf,
  uniqueKey: BytesFromUint8Array,
}) {
  toProto(options?: ParseOptions) {
    return Schema.encodeSync(Cursor)(this, options);
  }

  toBytes() {
    return proto.common.Cursor.encode(this.toProto()).finish();
  }

  static fromProto = Schema.decodeSync(Cursor);

  static fromBytes(bytes: Uint8Array) {
    return Cursor.fromProto(proto.common.Cursor.decode(bytes));
  }
}
