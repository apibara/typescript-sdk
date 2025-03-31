import type { Codec, CodecType } from "@apibara/protocol/codec";
import { hexToBytes, pad } from "viem";
import * as proto from "./proto";

const MAX_U64 = 0xffffffffffffffffn;

/** An Ethereum address. */
export const Address: Codec<`0x${string}`, proto.common.Address> = {
  encode(x) {
    const bytes = hexToBytes(pad(x, { size: 20, dir: "left" }));
    const dv = new DataView(bytes.buffer);
    const x0 = dv.getBigUint64(0);
    const x1 = dv.getBigUint64(8);
    const x2 = dv.getUint32(16);
    return { x0, x1, x2 };
  },
  decode(p) {
    const x0 = (p.x0 ?? 0n).toString(16).padStart(16, "0");
    const x1 = (p.x1 ?? 0n).toString(16).padStart(16, "0");
    const x2 = (p.x2 ?? 0n).toString(16).padStart(8, "0");
    return `0x${x0}${x1}${x2}` as `0x${string}`;
  },
};

export type Address = CodecType<typeof Address>;

/** Data with length 256 bits. */
export const B256: Codec<`0x${string}`, proto.common.B256> = {
  encode(x) {
    const bytes = hexToBytes(pad(x, { size: 32, dir: "left" }));
    const dv = new DataView(bytes.buffer);
    const x0 = dv.getBigUint64(0);
    const x1 = dv.getBigUint64(8);
    const x2 = dv.getBigUint64(16);
    const x3 = dv.getBigUint64(24);
    return { x0, x1, x2, x3 };
  },
  decode(p) {
    const x0 = (p.x0 ?? 0n).toString(16).padStart(16, "0");
    const x1 = (p.x1 ?? 0n).toString(16).padStart(16, "0");
    const x2 = (p.x2 ?? 0n).toString(16).padStart(16, "0");
    const x3 = (p.x3 ?? 0n).toString(16).padStart(16, "0");
    return `0x${x0}${x1}${x2}${x3}` as `0x${string}`;
  },
};

export type B256 = CodecType<typeof B256>;

export const b256ToProto = B256.encode;
export const b256FromProto = B256.decode;

/** Data with length 256 bits. */
export const U256: Codec<bigint, proto.common.U256> = {
  encode(x) {
    const x0 = (x >> (8n * 24n)) & MAX_U64;
    const x1 = (x >> (8n * 16n)) & MAX_U64;
    const x2 = (x >> (8n * 8n)) & MAX_U64;
    const x3 = x & MAX_U64;
    return { x0, x1, x2, x3 };
  },
  decode(p) {
    const x0 = p.x0 ?? 0n;
    const x1 = p.x1 ?? 0n;
    const x2 = p.x2 ?? 0n;
    const x3 = p.x3 ?? 0n;
    return (x0 << (8n * 24n)) + (x1 << (8n * 16n)) + (x2 << (8n * 8n)) + x3;
  },
};

export type U256 = CodecType<typeof U256>;

export const u256ToProto = U256.encode;
export const u256FromProto = U256.decode;

/** Data with length 128 bits. */
export const U128: Codec<bigint, proto.common.U128> = {
  encode(x) {
    const x0 = (x >> (8n * 8n)) & MAX_U64;
    const x1 = x & MAX_U64;
    return { x0, x1 };
  },
  decode(p) {
    const x0 = p.x0 ?? 0n;
    const x1 = p.x1 ?? 0n;
    return (x0 << (8n * 8n)) + x1;
  },
};

export type U128 = CodecType<typeof U128>;

export const u128ToProto = U128.encode;
export const u128FromProto = U128.decode;

export const ValidatorStatus: Codec<
  | "pending_initialized"
  | "pending_queued"
  | "active_ongoing"
  | "active_exiting"
  | "active_slashed"
  | "exited_unslashed"
  | "exited_slashed"
  | "withdrawal_possible"
  | "withdrawal_done"
  | "unknown",
  proto.common.ValidatorStatus
> = {
  encode(x) {
    const enumMap = {
      pending_initialized: proto.common.ValidatorStatus.PENDING_INITIALIZED,
      pending_queued: proto.common.ValidatorStatus.PENDING_QUEUED,
      active_ongoing: proto.common.ValidatorStatus.ACTIVE_ONGOING,
      active_exiting: proto.common.ValidatorStatus.ACTIVE_EXITING,
      active_slashed: proto.common.ValidatorStatus.ACTIVE_SLASHED,
      exited_unslashed: proto.common.ValidatorStatus.EXITED_UNSLASHED,
      exited_slashed: proto.common.ValidatorStatus.EXITED_SLASHED,
      withdrawal_possible: proto.common.ValidatorStatus.WITHDRAWAL_POSSIBLE,
      withdrawal_done: proto.common.ValidatorStatus.WITHDRAWAL_DONE,
      unknown: proto.common.ValidatorStatus.UNKNOWN,
    } as const;

    return enumMap[x] ?? proto.common.ValidatorStatus.UNKNOWN;
  },

  decode(p) {
    const enumMap = {
      [proto.common.ValidatorStatus.PENDING_INITIALIZED]: "pending_initialized",
      [proto.common.ValidatorStatus.PENDING_QUEUED]: "pending_queued",
      [proto.common.ValidatorStatus.ACTIVE_ONGOING]: "active_ongoing",
      [proto.common.ValidatorStatus.ACTIVE_EXITING]: "active_exiting",
      [proto.common.ValidatorStatus.ACTIVE_SLASHED]: "active_slashed",
      [proto.common.ValidatorStatus.EXITED_UNSLASHED]: "exited_unslashed",
      [proto.common.ValidatorStatus.EXITED_SLASHED]: "exited_slashed",
      [proto.common.ValidatorStatus.WITHDRAWAL_POSSIBLE]: "withdrawal_possible",
      [proto.common.ValidatorStatus.WITHDRAWAL_DONE]: "withdrawal_done",
      [proto.common.ValidatorStatus.UNKNOWN]: "unknown",
      [proto.common.ValidatorStatus.UNRECOGNIZED]: "unknown",
    } as const;

    return enumMap[p] ?? "unknown";
  },
};

export type ValidatorStatus = CodecType<typeof ValidatorStatus>;

export const B384: Codec<`0x${string}`, proto.common.B384> = {
  encode(x) {
    const bytes = hexToBytes(pad(x, { size: 48, dir: "left" }));
    const dv = new DataView(bytes.buffer);
    const x0 = dv.getBigUint64(0);
    const x1 = dv.getBigUint64(8);
    const x2 = dv.getBigUint64(16);
    const x3 = dv.getBigUint64(24);
    const x4 = dv.getBigUint64(32);
    const x5 = dv.getBigUint64(40);
    return { x0, x1, x2, x3, x4, x5 };
  },
  decode(p) {
    const x0 = (p.x0 ?? 0n).toString(16).padStart(16, "0");
    const x1 = (p.x1 ?? 0n).toString(16).padStart(16, "0");
    const x2 = (p.x2 ?? 0n).toString(16).padStart(16, "0");
    const x3 = (p.x3 ?? 0n).toString(16).padStart(16, "0");
    const x4 = (p.x4 ?? 0n).toString(16).padStart(16, "0");
    const x5 = (p.x5 ?? 0n).toString(16).padStart(16, "0");
    return `0x${x0}${x1}${x2}${x3}${x4}${x5}` as `0x${string}`;
  },
};

export type B384 = CodecType<typeof B384>;
