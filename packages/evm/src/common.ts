import { Schema } from "@effect/schema";

const _Address = Schema.TemplateLiteral(Schema.Literal("0x"), Schema.String);

/** Wire representation of `Address`. */
const AddressProto = Schema.Struct({
  loLo: Schema.BigIntFromSelf,
  loHi: Schema.BigIntFromSelf,
  hi: Schema.Number,
});

/** An Ethereum address. */
export const Address = Schema.transform(AddressProto, _Address, {
  decode(value) {
    const loLo = value.loLo.toString(16).padStart(16, "0");
    const loHi = value.loHi.toString(16).padStart(16, "0");
    const hi = value.hi.toString(16).padStart(8, "0");
    return `0x${loLo}${loHi}${hi}` as `0x${string}`;
  },
  encode(value) {
    const bn = BigInt(value);
    const hex = bn.toString(16).padStart(40, "0");
    const s = hex.length;
    const hi = Number(BigInt(`0x${hex.slice(s - 8, s)}`));
    const loHi = BigInt(`0x${hex.slice(s - 24, s - 8)}`);
    const loLo = BigInt(`0x${hex.slice(s - 40, s - 24)}`);
    return { loLo, loHi, hi };
  },
});

export type Address = typeof Address.Type;

const _B256 = Schema.TemplateLiteral(Schema.Literal("0x"), Schema.String);

/** Wire representation of `B256`. */
const B256Proto = Schema.Struct({
  loLo: Schema.BigIntFromSelf,
  loHi: Schema.BigIntFromSelf,
  hiLo: Schema.BigIntFromSelf,
  hiHi: Schema.BigIntFromSelf,
});

/** Data with length 256 bits. */
export const B256 = Schema.transform(B256Proto, _B256, {
  decode(value) {
    const loLo = value.loLo.toString(16).padStart(16, "0");
    const loHi = value.loHi.toString(16).padStart(16, "0");
    const hiLo = value.hiLo.toString(16).padStart(16, "0");
    const hiHi = value.hiHi.toString(16).padStart(16, "0");
    return `0x${loLo}${loHi}${hiLo}${hiHi}` as `0x${string}`;
  },
  encode(value) {
    const bn = BigInt(value);
    const hex = bn.toString(16).padStart(64, "0");
    const s = hex.length;
    const hiHi = BigInt(`0x${hex.slice(s - 16, s)}`);
    const hiLo = BigInt(`0x${hex.slice(s - 32, s - 16)}`);
    const loHi = BigInt(`0x${hex.slice(s - 48, s - 32)}`);
    const loLo = BigInt(`0x${hex.slice(s - 64, s - 48)}`);
    return { loLo, loHi, hiLo, hiHi };
  },
});

export const b256ToProto = Schema.encodeSync(B256);
export const b256FromProto = Schema.decodeSync(B256);
