import { Schema } from "@effect/schema";

const _FieldElement = Schema.TemplateLiteral(
  Schema.Literal("0x"),
  Schema.String,
);

/** Wire representation of `FieldElement`. */
const FieldElementProto = Schema.Struct({
  loLo: Schema.BigIntFromSelf,
  loHi: Schema.BigIntFromSelf,
  hiLo: Schema.BigIntFromSelf,
  hiHi: Schema.BigIntFromSelf,
});

/** Field element. */
export const FieldElement = Schema.transform(FieldElementProto, _FieldElement, {
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

export const feltToProto = Schema.encodeSync(FieldElement);
export const feltFromProto = Schema.decodeSync(FieldElement);
