import type { Codec, CodecType } from "@apibara/protocol/codec";
import * as proto from "./proto";

const MAX_U64 = 0xffffffffffffffffn;
const MAX_U32 = 0xffffffffn;

/** An Ethereum address. */
export const Address: Codec<`0x${string}`, proto.common.Address> = {
  encode(x) {
    const bn = BigInt(x);
    // Ethereum address is 20 bytes (160 bits)
    // Splitting into two 64-bit chunks and one 32-bit chunk
    const x2 = bn & MAX_U32;
    const x1 = (bn >> 32n) & MAX_U64;
    const x0 = (bn >> 96n) & MAX_U64;
    return { x0, x1, x2: Number(x2) };
  },
  decode(p) {
    const x0 = p.x0 ?? 0n;
    const x1 = p.x1 ?? 0n;
    const x2 = BigInt(p.x2 ?? 0);
    const bn = x2 + (x1 << 32n) + (x0 << 96n);
    return `0x${bn.toString(16).padStart(40, "0")}` as `0x${string}`;
  },
};

export type Address = CodecType<typeof Address>;

/** Data with length 256 bits. */
export const B256: Codec<`0x${string}`, proto.common.B256> = {
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

export type B256 = CodecType<typeof B256>;

/** Data with length 256 bits. */
export const U256: Codec<bigint, proto.common.U256> = {
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
    return x3 + (x2 << 64n) + (x1 << 128n) + (x0 << 192n);
  },
};

export type U256 = CodecType<typeof U256>;

/** Data with length 128 bits. */
export const U128: Codec<bigint, proto.common.U128> = {
  encode(x) {
    const x1 = x & MAX_U64;
    const x0 = (x >> 64n) & MAX_U64;
    return { x0, x1 };
  },
  decode(p) {
    const x0 = p.x0 ?? 0n;
    const x1 = p.x1 ?? 0n;
    return x1 + (x0 << 64n);
  },
};

export type U128 = CodecType<typeof U128>;

export const B384: Codec<`0x${string}`, proto.common.B384> = {
  encode(x) {
    const bn = BigInt(x);
    const x5 = bn & MAX_U64;
    const x4 = (bn >> 64n) & MAX_U64;
    const x3 = (bn >> 128n) & MAX_U64;
    const x2 = (bn >> 192n) & MAX_U64;
    const x1 = (bn >> 256n) & MAX_U64;
    const x0 = (bn >> 320n) & MAX_U64;
    return { x0, x1, x2, x3, x4, x5 };
  },
  decode(p) {
    const x0 = p.x0 ?? 0n;
    const x1 = p.x1 ?? 0n;
    const x2 = p.x2 ?? 0n;
    const x3 = p.x3 ?? 0n;
    const x4 = p.x4 ?? 0n;
    const x5 = p.x5 ?? 0n;
    const bn =
      x5 +
      (x4 << 64n) +
      (x3 << 128n) +
      (x2 << 192n) +
      (x1 << 256n) +
      (x0 << 320n);

    return `0x${bn.toString(16).padStart(96, "0")}` as `0x${string}`;
  },
};

export type B384 = CodecType<typeof B384>;

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
