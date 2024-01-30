import { assertType, describe, test } from "vitest";

import { type Abi } from "starknet";
import { Contract, EventFilterArgs } from "./parser";
import { FieldElement } from "./felt";
import { Event } from "./block";

describe("Contract", () => {
  describe("EventFilterArgs", () => {
    test("works with struct events", () => {
      assertType<
        EventFilterArgs<
          typeof abi,
          "test::upgradeable::Upgradeable::ClassHashReplaced"
        >
      >({
        name: "test::upgradeable::Upgradeable::ClassHashReplaced",
      });
    });

    test("works with enum events", () => {
      assertType<EventFilterArgs<typeof abi, "test::Event">>({
        name: "test::Event",
        variant: "TestCounterIncreased",
      });

      assertType<EventFilterArgs<typeof abi, "test::MixedEvent">>({
        name: "test::MixedEvent",
        variant: "UpgradeableEvent",
      });
    });
  });
});

export const abi = [
  {
    type: "event",
    name: "test::Event",
    kind: "enum",
    variants: [
      {
        name: "TestCounterIncreased",
        type: "test::CounterIncreased",
        kind: "nested",
      },
      {
        name: "TestCounterDecreased",
        type: "test::CounterDecreased",
        kind: "nested",
      },
    ],
  },
  {
    type: "event",
    name: "test::CounterIncreased",
    kind: "struct",
    members: [
      {
        name: "amount",
        type: "core::integer::u128",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "test::CounterDecreased",
    kind: "struct",
    members: [
      {
        name: "amount",
        type: "core::integer::u128",
        kind: "data",
      },
    ],
  },
  {
    kind: "struct",
    name: "test::upgradeable::Upgradeable::ClassHashReplaced",
    type: "event",
    members: [
      {
        kind: "data",
        name: "new_class_hash",
        type: "core::starknet::class_hash::ClassHash",
      },
    ],
  },
  {
    kind: "enum",
    name: "test::upgradeable::Upgradeable::Event",
    type: "event",
    variants: [
      {
        kind: "nested",
        name: "ClassHashReplaced",
        type: "test::upgradeable::Upgradeable::ClassHashReplaced",
      },
    ],
  },
  {
    type: "event",
    name: "test::MixedEvent",
    kind: "enum",
    variants: [
      {
        name: "TestCounterIncreased",
        type: "test::CounterIncreased",
        kind: "nested",
      },
      {
        name: "TestCounterDecreased",
        type: "test::CounterDecreased",
        kind: "nested",
      },
      {
        name: "UpgradeableEvent",
        type: "test::upgradeable::Upgradeable::Event",
        kind: "flat",
      },
    ],
  },
] as const satisfies Abi;
