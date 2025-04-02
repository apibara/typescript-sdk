import type { Codec, CodecType } from "@apibara/protocol/codec";
import type * as proto from "./proto";

const MAX_U64 = 0xffffffffffffffffn;

export const FieldElement: Codec<`0x${string}`, proto.common.FieldElement> = {
  encode(x) {
    const bn = BigInt(x);
    const x3 = bn & MAX_U64;
    const x2 = (bn >> 64n) & MAX_U64;
    const x1 = (bn >> 128n) & MAX_U64;
    const x0 = (bn >> 192n) & MAX_U64;
    return { x0, x1, x2, x3 };
  },
  decode(p) {
    const x0 = p.x0 ?? 0n;
    const x1 = p.x1 ?? 0n;
    const x2 = p.x2 ?? 0n;
    const x3 = p.x3 ?? 0n;
    const bn = x3 + (x2 << 64n) + (x1 << 128n) + (x0 << 192n);
    return `0x${bn.toString(16).padStart(64, "0")}` as `0x${string}`;
  },
};

export type FieldElement = CodecType<typeof FieldElement>;
