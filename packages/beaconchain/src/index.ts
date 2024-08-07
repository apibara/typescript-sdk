import { StreamConfig } from "@apibara/protocol";
import { BlockFromBytes } from "./block";
import { FilterFromBytes, mergeFilter } from "./filter";

export * as proto from "./proto";

export * from "./common";
export * from "./filter";
export * from "./block";

export const BeaconChainStream = new StreamConfig(
  FilterFromBytes,
  BlockFromBytes,
  mergeFilter,
);
