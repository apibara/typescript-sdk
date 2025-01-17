import { StreamConfig } from "@apibara/protocol";
export type { Abi } from "abi-wan-kanabi";
import { BlockFromBytes } from "./block";
import { FilterFromBytes, mergeFilter } from "./filter";

export * as proto from "./proto";

export * from "./common";
export * from "./filter";
export * from "./block";

export * from "./access";
export * from "./event";
export { getBigIntSelector, getEventSelector, getSelector } from "./abi";

declare module "abi-wan-kanabi" {
  interface Config {
    FeltType: bigint;
    BigIntType: bigint;
    U256Type: bigint;
  }
}

export const StarknetStream = new StreamConfig(
  FilterFromBytes,
  BlockFromBytes,
  mergeFilter,
);
