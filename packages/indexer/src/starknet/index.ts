export * from "./filter";
export * from "./block";

import { Filter } from "./filter";

/** Starknet network type and data filter. */
export type Starknet = {
  network: "starknet";
  filter: Filter;
};
