import { StreamConfig } from "@apibara/protocol";
import { BlockFromBytes } from "./block";
import { FilterFromBytes, mergeFilter } from "./filter";

export * as proto from "./proto";

export * from "./common";
export * from "./filter";
export * from "./block";

export * from "./access";

export const StarknetStream = new StreamConfig(
  FilterFromBytes,
  BlockFromBytes,
  mergeFilter,
);
