import { hexToBytes, toHex } from "viem";
import { Schema } from "@effect/schema";
import type { ParseOptions } from "@effect/schema/AST";

export const Bytes = Schema.TemplateLiteral(
  Schema.Literal("0x"),
  Schema.String,
);

const BytesFromUint8Array = Schema.transform(Schema.Uint8ArrayFromSelf, Bytes, {
  encode(value) {
    return hexToBytes(value);
  },
  decode(value) {
    return toHex(value);
  },
});

export interface ProtoMessage<TProto> {
  toProto(options?: ParseOptions): TProto;
}

export class Cursor extends Schema.Class<Cursor>("Cursor")({
  orderKey: Schema.BigIntFromSelf,
  uniqueKey: Schema.optional(BytesFromUint8Array),
}) {
  toProto(options?: ParseOptions) {
    return Schema.encodeSync(Cursor)(this, options);
  }

  // toBytes() {
  //   return proto.common.Cursor.encode(this.toProto()).finish();
  // }

  static fromProto = Schema.decodeSync(Cursor);

  // static fromBytes(bytes: Uint8Array) {
  //   return Cursor.fromProto(proto.common.Cursor.decode(bytes));
  // }
}
