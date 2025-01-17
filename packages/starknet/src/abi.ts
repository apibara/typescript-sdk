import { keccak } from "@scure/starknet";

import type { FieldElement } from "./common";
import {
  parseBool,
  parseContractAddress,
  parseFelt252,
  parseU8,
  parseU16,
  parseU32,
  parseU64,
  parseU128,
  parseU256,
} from "./parser";

/** Returns the selector of the provided `name` as a bigint. */
export function getBigIntSelector(name: string): bigint {
  const asBytes = new TextEncoder().encode(name);
  return keccak(asBytes);
}

/** Returns the selector of the provided `name` as a FieldElement. */
export function getSelector(name: string): FieldElement {
  const bn = getBigIntSelector(name);
  return `0x${bn.toString(16).padStart(64, "0")}`;
}

/** Returns the selector of the provided event with `name` as a FieldElement.
 *
 * If the name is fully qualified, only the last part is used to compute the selector.
 */
export function getEventSelector(name: string): FieldElement {
  const parts = name.split("::");
  return getSelector(parts[parts.length - 1]);
}

export const PrimitiveTypeParsers = {
  "core::bool": parseBool,
  "core::felt252": parseFelt252,
  "core::integer::u8": parseU8,
  "core::integer::u16": parseU16,
  "core::integer::u32": parseU32,
  "core::integer::u64": parseU64,
  "core::integer::u128": parseU128,
  "core::integer::u256": parseU256,
  "core::starknet::contract_address::ContractAddress": parseContractAddress,
};

export function isPrimitiveType(type: string) {
  return type in PrimitiveTypeParsers;
}

export function isArrayType(type: string) {
  return type.startsWith("core::array::Array::<") && type.endsWith(">");
}

export function getArrayElementType(type: string) {
  return type.slice("core::array::Array::<".length, -1);
}

export function isSpanType(type: string) {
  return type.startsWith("core::array::Span::<") && type.endsWith(">");
}

export function getSpanType(type: string) {
  return type.slice("core::array::Span::<".length, -1);
}

export function isOptionType(type: string) {
  return type.startsWith("core::option::Option::<") && type.endsWith(">");
}

export function getOptionType(type: string) {
  return type.slice("core::option::Option::<".length, -1);
}

export function isEmptyType(type: string) {
  return type === "()";
}
