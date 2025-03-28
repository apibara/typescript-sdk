import type { Codec, CodecType } from "@apibara/protocol/codec";
import type * as proto from "./proto";

export const FieldElement: Codec<`0x${string}`, proto.common.FieldElement> = {
  encode(x) {
    const bn = BigInt(x);
    const hex = bn.toString(16).padStart(64, "0");
    const s = hex.length;
    const x3 = BigInt(`0x${hex.slice(s - 16, s)}`);
    const x2 = BigInt(`0x${hex.slice(s - 32, s - 16)}`);
    const x1 = BigInt(`0x${hex.slice(s - 48, s - 32)}`);
    const x0 = BigInt(`0x${hex.slice(s - 64, s - 48)}`);
    return { x0, x1, x2, x3 };
  },
  decode(p) {
    const x0 = p.x0?.toString(16).padStart(16, "0");
    const x1 = p.x1?.toString(16).padStart(16, "0");
    const x2 = p.x2?.toString(16).padStart(16, "0");
    const x3 = p.x3?.toString(16).padStart(16, "0");
    return `0x${x0}${x1}${x2}${x3}` as `0x${string}`;
  },
};

export type FieldElement = CodecType<typeof FieldElement>;

export const feltToProto = FieldElement.encode;
export const feltFromProto = FieldElement.decode;
