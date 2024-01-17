export * from "./filter";
export * from "./block";
export { FieldElement, getSelector } from "./felt";
export { Contract } from "./parser";

import { Filter } from "./filter";

/** Starknet network type and data filter. */
export type Starknet = {
  network: "starknet";
  filter: Filter;
};
