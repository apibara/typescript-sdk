import { Schema } from "@effect/schema";
import { hexToBytes, pad } from "viem";

import * as proto from "./proto";

// Re-export common types
export { Address, U128, U256, B256 } from "@apibara/evm";

export const ValidatorStatus = Schema.transform(
  Schema.Enums(proto.common.ValidatorStatus),
  Schema.Literal(
    "pending_initialized",
    "pending_queued",
    "active_ongoing",
    "active_exiting",
    "active_slashed",
    "exited_unslashed",
    "exited_slashed",
    "withdrawal_possible",
    "withdrawal_done",
    "unknown",
  ),
  {
    decode(value) {
      const enumMap = {
        [proto.common.ValidatorStatus.PENDING_INITIALIZED]:
          "pending_initialized",
        [proto.common.ValidatorStatus.PENDING_QUEUED]: "pending_queued",
        [proto.common.ValidatorStatus.ACTIVE_ONGOING]: "active_ongoing",
        [proto.common.ValidatorStatus.ACTIVE_EXITING]: "active_exiting",
        [proto.common.ValidatorStatus.ACTIVE_SLASHED]: "active_slashed",
        [proto.common.ValidatorStatus.EXITED_UNSLASHED]: "exited_unslashed",
        [proto.common.ValidatorStatus.EXITED_SLASHED]: "exited_slashed",
        [proto.common.ValidatorStatus.WITHDRAWAL_POSSIBLE]:
          "withdrawal_possible",
        [proto.common.ValidatorStatus.WITHDRAWAL_DONE]: "withdrawal_done",
        [proto.common.ValidatorStatus.UNKNOWN]: "unknown",
        [proto.common.ValidatorStatus.UNRECOGNIZED]: "unknown",
      } as const;

      return enumMap[value] ?? "unknown";
    },
    encode(value) {
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

      return enumMap[value] ?? proto.common.ValidatorStatus.UNKNOWN;
    },
  },
);

export type ValidatorStatus = typeof ValidatorStatus.Type;

const _B384 = Schema.TemplateLiteral(Schema.Literal("0x"), Schema.String);
const B384Proto = Schema.Struct({
  x0: Schema.BigIntFromSelf,
  x1: Schema.BigIntFromSelf,
  x2: Schema.BigIntFromSelf,
  x3: Schema.BigIntFromSelf,
  x4: Schema.BigIntFromSelf,
  x5: Schema.BigIntFromSelf,
});

export const B384 = Schema.transform(B384Proto, _B384, {
  decode(value) {
    const x0 = value.x0.toString(16).padStart(16, "0");
    const x1 = value.x1.toString(16).padStart(16, "0");
    const x2 = value.x2.toString(16).padStart(16, "0");
    const x3 = value.x3.toString(16).padStart(16, "0");
    const x4 = value.x4.toString(16).padStart(16, "0");
    const x5 = value.x5.toString(16).padStart(16, "0");
    return `0x${x0}${x1}${x2}${x3}${x4}${x5}` as `0x${string}`;
  },
  encode(value) {
    const bytes = hexToBytes(pad(value, { size: 48, dir: "left" }));
    const dv = new DataView(bytes.buffer);
    const x0 = dv.getBigUint64(0);
    const x1 = dv.getBigUint64(8);
    const x2 = dv.getBigUint64(16);
    const x3 = dv.getBigUint64(24);
    const x4 = dv.getBigUint64(32);
    const x5 = dv.getBigUint64(40);
    return { x0, x1, x2, x3, x4, x5 };
  },
});

export type B384 = typeof B384.Type;
