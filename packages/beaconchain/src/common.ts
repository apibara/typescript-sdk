import { Schema } from "@effect/schema";

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
        ["pending_initialized"]:
          proto.common.ValidatorStatus.PENDING_INITIALIZED,
        ["pending_queued"]: proto.common.ValidatorStatus.PENDING_QUEUED,
        ["active_ongoing"]: proto.common.ValidatorStatus.ACTIVE_ONGOING,
        ["active_exiting"]: proto.common.ValidatorStatus.ACTIVE_EXITING,
        ["active_slashed"]: proto.common.ValidatorStatus.ACTIVE_SLASHED,
        ["exited_unslashed"]: proto.common.ValidatorStatus.EXITED_UNSLASHED,
        ["exited_slashed"]: proto.common.ValidatorStatus.EXITED_SLASHED,
        ["withdrawal_possible"]:
          proto.common.ValidatorStatus.WITHDRAWAL_POSSIBLE,
        ["withdrawal_done"]: proto.common.ValidatorStatus.WITHDRAWAL_DONE,
        ["unknown"]: proto.common.ValidatorStatus.UNKNOWN,
      } as const;

      return enumMap[value] ?? proto.common.ValidatorStatus.UNKNOWN;
    },
  },
);
