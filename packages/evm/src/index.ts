import { StreamConfig } from "@apibara/protocol";
import { FilterFromBytes } from "./filter";
import { BlockFromBytes } from "./block";

export * as proto from "./proto";

export * from "./common";
export * from "./filter";
export * from "./block";

export const EvmStream = new StreamConfig(FilterFromBytes, BlockFromBytes);
