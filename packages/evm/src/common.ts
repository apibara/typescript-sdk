import { Schema } from "@effect/schema";
import { hexToBytes, pad } from "viem";

const MAX_U64 = 0xffffffffffffffffn;

const _Address = Schema.TemplateLiteral(Schema.Literal("0x"), Schema.String);

/** Wire representation of `Address`. */
const AddressProto = Schema.Struct({
  x0: Schema.BigIntFromSelf,
  x1: Schema.BigIntFromSelf,
  x2: Schema.Number,
});

/** An Ethereum address. */
export const Address = Schema.transform(AddressProto, _Address, {
  decode(value) {
    const x0 = value.x0.toString(16).padStart(16, "0");
    const x1 = value.x1.toString(16).padStart(16, "0");
    const x2 = value.x2.toString(16).padStart(8, "0");
    return `0x${x0}${x1}${x2}` as `0x${string}`;
  },
  encode(value) {
    const bytes = hexToBytes(pad(value, { size: 20, dir: "left" }));
    const dv = new DataView(bytes.buffer);
    const x0 = dv.getBigUint64(0);
    const x1 = dv.getBigUint64(8);
    const x2 = dv.getUint32(16);
    return { x0, x1, x2 };
  },
});

export type Address = typeof Address.Type;

const _B256 = Schema.TemplateLiteral(Schema.Literal("0x"), Schema.String);

/** Wire representation of `B256`. */
export const B256Proto = Schema.Struct({
  x0: Schema.BigIntFromSelf,
  x1: Schema.BigIntFromSelf,
  x2: Schema.BigIntFromSelf,
  x3: Schema.BigIntFromSelf,
});

/** Data with length 256 bits. */
export const B256 = Schema.transform(B256Proto, _B256, {
  decode(value) {
    const x0 = value.x0.toString(16).padStart(16, "0");
    const x1 = value.x1.toString(16).padStart(16, "0");
    const x2 = value.x2.toString(16).padStart(16, "0");
    const x3 = value.x3.toString(16).padStart(16, "0");
    return `0x${x0}${x1}${x2}${x3}` as `0x${string}`;
  },
  encode(value) {
    const bytes = hexToBytes(pad(value, { size: 32, dir: "left" }));
    const dv = new DataView(bytes.buffer);
    const x0 = dv.getBigUint64(0);
    const x1 = dv.getBigUint64(8);
    const x2 = dv.getBigUint64(16);
    const x3 = dv.getBigUint64(24);
    return { x0, x1, x2, x3 };
  },
});

export type B256 = typeof B256.Type;

export const b256ToProto = Schema.encodeSync(B256);
export const b256FromProto = Schema.decodeSync(B256);

/** Wire representation of `U256`. */
const U256Proto = Schema.Struct({
  x0: Schema.BigIntFromSelf,
  x1: Schema.BigIntFromSelf,
  x2: Schema.BigIntFromSelf,
  x3: Schema.BigIntFromSelf,
});

/** Data with length 256 bits. */
export const U256 = Schema.transform(U256Proto, Schema.BigIntFromSelf, {
  decode(value) {
    return (
      (value.x0 << (8n * 24n)) +
      (value.x1 << (8n * 16n)) +
      (value.x2 << (8n * 8n)) +
      value.x3
    );
  },
  encode(value) {
    const x0 = (value >> (8n * 24n)) & MAX_U64;
    const x1 = (value >> (8n * 16n)) & MAX_U64;
    const x2 = (value >> (8n * 8n)) & MAX_U64;
    const x3 = value & MAX_U64;
    return { x0, x1, x2, x3 };
  },
});

export type U256 = typeof U256.Type;

export const u256ToProto = Schema.encodeSync(U256);
export const u256FromProto = Schema.decodeSync(U256);

/** Wire representation of `U128`. */
const U128Proto = Schema.Struct({
  x0: Schema.BigIntFromSelf,
  x1: Schema.BigIntFromSelf,
});

/** Data with length 128 bits. */
export const U128 = Schema.transform(U128Proto, Schema.BigIntFromSelf, {
  decode(value) {
    return (value.x0 << (8n * 8n)) + value.x1;
  },
  encode(value) {
    const x0 = (value >> (8n * 8n)) & MAX_U64;
    const x1 = value & MAX_U64;
    return { x0, x1 };
  },
});

export type U128 = typeof U128.Type;

export const u128ToProto = Schema.encodeSync(U128);
export const u128FromProto = Schema.decodeSync(U128);
