export * from "./filter";
export * from "./block";
export { Contract } from "./parser";

import { Filter } from "./filter";

/** Starknet network type and data filter. */
export type Starknet = {
  network: "starknet";
  filter: Filter;
};
