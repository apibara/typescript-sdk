import { Schema } from "@effect/schema";

const _FieldElement = Schema.TemplateLiteral(
  Schema.Literal("0x"),
  Schema.String,
);

/** Wire representation of `FieldElement`. */
export const FieldElementProto = Schema.Struct({
  x0: Schema.BigIntFromSelf,
  x1: Schema.BigIntFromSelf,
  x2: Schema.BigIntFromSelf,
  x3: Schema.BigIntFromSelf,
});

/** Field element. */
export const FieldElement = Schema.transform(FieldElementProto, _FieldElement, {
  decode(value) {
    const x0 = value.x0.toString(16).padStart(16, "0");
    const x1 = value.x1.toString(16).padStart(16, "0");
    const x2 = value.x2.toString(16).padStart(16, "0");
    const x3 = value.x3.toString(16).padStart(16, "0");
    return `0x${x0}${x1}${x2}${x3}` as `0x${string}`;
  },
  encode(value) {
    const bn = BigInt(value);
    const hex = bn.toString(16).padStart(64, "0");
    const s = hex.length;
    const x3 = BigInt(`0x${hex.slice(s - 16, s)}`);
    const x2 = BigInt(`0x${hex.slice(s - 32, s - 16)}`);
    const x1 = BigInt(`0x${hex.slice(s - 48, s - 32)}`);
    const x0 = BigInt(`0x${hex.slice(s - 64, s - 48)}`);
    return { x0, x1, x2, x3 };
  },
});

export type FieldElement = Schema.Schema.Type<typeof FieldElement>;

export const feltToProto = Schema.encodeSync(FieldElement);
export const feltFromProto = Schema.decodeSync(FieldElement);
