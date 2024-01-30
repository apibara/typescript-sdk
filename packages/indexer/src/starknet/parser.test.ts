import { describe, expect, it } from "vitest";
import { Contract } from "./parser";
import { FieldElement } from "./felt";
import { Abi } from "starknet";
import { Event } from "./block";

describe("Contract", () => {
  describe("eventFilter", () => {
    it("should create an EventFilter for a valid struct event", () => {
      const contract = new Contract({ address, abi });
      const filter = contract.eventFilter({
        name: "ekubo::core::Core::SavedBalance",
      });

      expect(filter).toBeDefined();
      expect(filter.fromAddress).toBe(address);
      expect(filter.keys).toEqual([
        FieldElement.parse(
          "0x0354c2630060a9ac1ae3e43937744518643165649592ebcd1cc2182ad512fdad",
        ),
      ]);
      expect(filter.includeReceipt).toBeFalsy();
    });

    it("should create an EventFilter for a valid enum event", () => {
      const contract = new Contract({ address, abi });
      const filter = contract.eventFilter({
        name: "ekubo::core::Core::Event",
        variant: "Swapped",
      });

      expect(filter).toBeDefined();
      expect(filter.fromAddress).toBe(address);
      expect(filter.keys).toEqual([
        FieldElement.parse(
          "0x157717768aca88da4ac4279765f09f4d0151823d573537fbbeb950cdbd9a870",
        ),
      ]);
      expect(filter.includeReceipt).toBeFalsy();
    });

    it("overrides some DNA arguments", () => {
      const contract = new Contract({ abi, address });
      const filter = contract.eventFilter(
        {
          name: "ekubo::core::Core::Event",
          variant: "Swapped",
        },
        {
          includeReceipt: true,
        },
      );

      expect(filter).toBeDefined();
      expect(filter.includeReceipt).toBeTruthy();
    });

    it("overrides the address", () => {
      const contract = new Contract({ abi, address });

      const filter = contract.eventFilter(
        {
          name: "ekubo::core::Core::Event",
          variant: "Swapped",
        },
        {
          address: "0x00",
        },
      );
      expect(filter).toBeDefined();
      expect(filter.fromAddress).toEqual(FieldElement.parse("0x00"));

      const filter2 = contract.eventFilter(
        {
          name: "ekubo::core::Core::Event",
          variant: "Swapped",
        },
        {
          address: null,
        },
      );

      expect(filter2).toBeDefined();
      expect(filter2.fromAddress).toBeUndefined();
    });

    it("should throw an error for an invalid event name", () => {
      const contract = new Contract({ address, abi });

      expect(() => {
        // @ts-expect-error
        const filter = contract.eventFilter({
          name: "InvalidEvent",
        });
      }).toThrow("Event InvalidEvent not found in contract ABI");
    });

    it("should throw an error for a missing enum variant name", () => {
      const contract = new Contract({ address, abi });

      expect(() => {
        // @ts-expect-error
        const filter = contract.eventFilter({
          name: "ekubo::core::Core::Event",
        });
      }).toThrow(
        "Event ekubo::core::Core::Event is an enum, but no variant was provided",
      );
    });

    it("should throw an error for an invalid enum variant name", () => {
      const contract = new Contract({ address, abi });

      expect(() => {
        const filter = contract.eventFilter({
          name: "ekubo::core::Core::Event",
          // @ts-expect-error
          variant: "InvalidVariant",
        });
      }).toThrow(
        "Event ekubo::core::Core::Event has no variant InvalidVariant",
      );
    });
  });
  /*

  describe("lookupEventFromSelector", () => {
    it("can lookup an event name by its selector", () => {
      const contract = new Contract({ address, abi });
      const filter = contract.eventFilter("ekubo::core::Core::Swapped");
      const eventName = contract.lookupEventFromSelector(
        filter.keys?.[0] ?? "0x00",
      );

      expect(eventName).toEqual("ekubo::core::Core::Swapped");
    });

    it("returns undefined if no event matches", () => {
      const contract = new Contract({ address, abi });
      const eventName = contract.lookupEventFromSelector(
        "0x1234567890123456789012345678901234567890123456789012345678901234",
      );

      expect(eventName).toBeUndefined();
    });
  });

  describe("decodeEvent", () => {
    it("returns the decoded event", () => {
      const contract = new Contract({ address, abi });
      const event: Event = {
        fromAddress: address,
        keys: [
          FieldElement.parse(
            "0x157717768aca88da4ac4279765f09f4d0151823d573537fbbeb950cdbd9a870",
          ),
        ],
        data: [
          "0x1b6f560def289b32e2a7b0920909615531a4d9d5636ca509045843559dc23d5",
          "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
          "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
          "0x20c49ba5e353f80000000000000000",
          "0x3e8",
          "0x0",
          "0x38d7ea4c68000",
          "0x0",
          "0x0",
          "0x2ff6e62eb235810901779e25e7649",
          "0x0",
          "0x0",
          "0x38d7ea4c68000",
          "0x0",
          "0x234467",
          "0x1",
          "0x326c71d2ba9788c839248c98ea38b",
          "0x0",
          "0x12f6bb3",
          "0x1",
          "0x1271eb68c3b02743",
        ].map((v) => FieldElement.parse(v)),
      };
      const decoded = contract.decodeEvent({ event });

      expect(decoded?.name).toEqual("ekubo::core::Core::Event");

      console.log(decoded);
      if (decoded?.name === "ekubo::core::Core::Event") {
      }
    });
  });
*/
});

// Use the Ekubo ABI for testing since it contains several complex types.
const address =
  "0x00000005dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b";
export const abi = [
  {
    name: "CoreHasInterface",
    type: "impl",
    interface_name: "ekubo::components::upgradeable::IHasInterface",
  },
  {
    name: "ekubo::components::upgradeable::IHasInterface",
    type: "interface",
    items: [
      {
        name: "get_primary_interface_id",
        type: "function",
        inputs: [],
        outputs: [
          {
            type: "core::felt252",
          },
        ],
        state_mutability: "view",
      },
    ],
  },
  {
    name: "Core",
    type: "impl",
    interface_name: "ekubo::interfaces::core::ICore",
  },
  {
    name: "ekubo::interfaces::core::LockerState",
    type: "struct",
    members: [
      {
        name: "address",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "nonzero_delta_count",
        type: "core::integer::u32",
      },
    ],
  },
  {
    name: "ekubo::types::keys::PoolKey",
    type: "struct",
    members: [
      {
        name: "token0",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "token1",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "fee",
        type: "core::integer::u128",
      },
      {
        name: "tick_spacing",
        type: "core::integer::u128",
      },
      {
        name: "extension",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    name: "core::integer::u256",
    type: "struct",
    members: [
      {
        name: "low",
        type: "core::integer::u128",
      },
      {
        name: "high",
        type: "core::integer::u128",
      },
    ],
  },
  {
    name: "core::bool",
    type: "enum",
    variants: [
      {
        name: "False",
        type: "()",
      },
      {
        name: "True",
        type: "()",
      },
    ],
  },
  {
    name: "ekubo::types::i129::i129",
    type: "struct",
    members: [
      {
        name: "mag",
        type: "core::integer::u128",
      },
      {
        name: "sign",
        type: "core::bool",
      },
    ],
  },
  {
    name: "ekubo::types::call_points::CallPoints",
    type: "struct",
    members: [
      {
        name: "after_initialize_pool",
        type: "core::bool",
      },
      {
        name: "before_swap",
        type: "core::bool",
      },
      {
        name: "after_swap",
        type: "core::bool",
      },
      {
        name: "before_update_position",
        type: "core::bool",
      },
      {
        name: "after_update_position",
        type: "core::bool",
      },
    ],
  },
  {
    name: "ekubo::types::pool_price::PoolPrice",
    type: "struct",
    members: [
      {
        name: "sqrt_ratio",
        type: "core::integer::u256",
      },
      {
        name: "tick",
        type: "ekubo::types::i129::i129",
      },
      {
        name: "call_points",
        type: "ekubo::types::call_points::CallPoints",
      },
    ],
  },
  {
    name: "ekubo::types::fees_per_liquidity::FeesPerLiquidity",
    type: "struct",
    members: [
      {
        name: "value0",
        type: "core::felt252",
      },
      {
        name: "value1",
        type: "core::felt252",
      },
    ],
  },
  {
    name: "ekubo::types::bounds::Bounds",
    type: "struct",
    members: [
      {
        name: "lower",
        type: "ekubo::types::i129::i129",
      },
      {
        name: "upper",
        type: "ekubo::types::i129::i129",
      },
    ],
  },
  {
    name: "ekubo::types::keys::PositionKey",
    type: "struct",
    members: [
      {
        name: "salt",
        type: "core::felt252",
      },
      {
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "bounds",
        type: "ekubo::types::bounds::Bounds",
      },
    ],
  },
  {
    name: "ekubo::types::position::Position",
    type: "struct",
    members: [
      {
        name: "liquidity",
        type: "core::integer::u128",
      },
      {
        name: "fees_per_liquidity_inside_last",
        type: "ekubo::types::fees_per_liquidity::FeesPerLiquidity",
      },
    ],
  },
  {
    name: "ekubo::interfaces::core::GetPositionWithFeesResult",
    type: "struct",
    members: [
      {
        name: "position",
        type: "ekubo::types::position::Position",
      },
      {
        name: "fees0",
        type: "core::integer::u128",
      },
      {
        name: "fees1",
        type: "core::integer::u128",
      },
      {
        name: "fees_per_liquidity_inside_current",
        type: "ekubo::types::fees_per_liquidity::FeesPerLiquidity",
      },
    ],
  },
  {
    name: "ekubo::types::keys::SavedBalanceKey",
    type: "struct",
    members: [
      {
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "token",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "salt",
        type: "core::felt252",
      },
    ],
  },
  {
    name: "core::option::Option::<core::integer::u256>",
    type: "enum",
    variants: [
      {
        name: "Some",
        type: "core::integer::u256",
      },
      {
        name: "None",
        type: "()",
      },
    ],
  },
  {
    name: "ekubo::interfaces::core::UpdatePositionParameters",
    type: "struct",
    members: [
      {
        name: "salt",
        type: "core::felt252",
      },
      {
        name: "bounds",
        type: "ekubo::types::bounds::Bounds",
      },
      {
        name: "liquidity_delta",
        type: "ekubo::types::i129::i129",
      },
    ],
  },
  {
    name: "ekubo::types::delta::Delta",
    type: "struct",
    members: [
      {
        name: "amount0",
        type: "ekubo::types::i129::i129",
      },
      {
        name: "amount1",
        type: "ekubo::types::i129::i129",
      },
    ],
  },
  {
    name: "ekubo::interfaces::core::SwapParameters",
    type: "struct",
    members: [
      {
        name: "amount",
        type: "ekubo::types::i129::i129",
      },
      {
        name: "is_token1",
        type: "core::bool",
      },
      {
        name: "sqrt_ratio_limit",
        type: "core::integer::u256",
      },
      {
        name: "skip_ahead",
        type: "core::integer::u128",
      },
    ],
  },
  {
    name: "ekubo::interfaces::core::ICore",
    type: "interface",
    items: [
      {
        name: "get_protocol_fees_collected",
        type: "function",
        inputs: [
          {
            name: "token",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [
          {
            type: "core::integer::u128",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "get_locker_state",
        type: "function",
        inputs: [
          {
            name: "id",
            type: "core::integer::u32",
          },
        ],
        outputs: [
          {
            type: "ekubo::interfaces::core::LockerState",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "get_pool_price",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
        ],
        outputs: [
          {
            type: "ekubo::types::pool_price::PoolPrice",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "get_pool_liquidity",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
        ],
        outputs: [
          {
            type: "core::integer::u128",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "get_pool_fees_per_liquidity",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
        ],
        outputs: [
          {
            type: "ekubo::types::fees_per_liquidity::FeesPerLiquidity",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "get_pool_fees_per_liquidity_inside",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
          {
            name: "bounds",
            type: "ekubo::types::bounds::Bounds",
          },
        ],
        outputs: [
          {
            type: "ekubo::types::fees_per_liquidity::FeesPerLiquidity",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "get_pool_tick_liquidity_delta",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
          {
            name: "index",
            type: "ekubo::types::i129::i129",
          },
        ],
        outputs: [
          {
            type: "ekubo::types::i129::i129",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "get_pool_tick_liquidity_net",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
          {
            name: "index",
            type: "ekubo::types::i129::i129",
          },
        ],
        outputs: [
          {
            type: "core::integer::u128",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "get_pool_tick_fees_outside",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
          {
            name: "index",
            type: "ekubo::types::i129::i129",
          },
        ],
        outputs: [
          {
            type: "ekubo::types::fees_per_liquidity::FeesPerLiquidity",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "get_position",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
          {
            name: "position_key",
            type: "ekubo::types::keys::PositionKey",
          },
        ],
        outputs: [
          {
            type: "ekubo::types::position::Position",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "get_position_with_fees",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
          {
            name: "position_key",
            type: "ekubo::types::keys::PositionKey",
          },
        ],
        outputs: [
          {
            type: "ekubo::interfaces::core::GetPositionWithFeesResult",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "get_saved_balance",
        type: "function",
        inputs: [
          {
            name: "key",
            type: "ekubo::types::keys::SavedBalanceKey",
          },
        ],
        outputs: [
          {
            type: "core::integer::u128",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "next_initialized_tick",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
          {
            name: "from",
            type: "ekubo::types::i129::i129",
          },
          {
            name: "skip_ahead",
            type: "core::integer::u128",
          },
        ],
        outputs: [
          {
            type: "(ekubo::types::i129::i129, core::bool)",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "prev_initialized_tick",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
          {
            name: "from",
            type: "ekubo::types::i129::i129",
          },
          {
            name: "skip_ahead",
            type: "core::integer::u128",
          },
        ],
        outputs: [
          {
            type: "(ekubo::types::i129::i129, core::bool)",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "withdraw_protocol_fees",
        type: "function",
        inputs: [
          {
            name: "recipient",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "token",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "amount",
            type: "core::integer::u128",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "lock",
        type: "function",
        inputs: [
          {
            name: "data",
            type: "core::array::Array::<core::felt252>",
          },
        ],
        outputs: [
          {
            type: "core::array::Array::<core::felt252>",
          },
        ],
        state_mutability: "external",
      },
      {
        name: "withdraw",
        type: "function",
        inputs: [
          {
            name: "token_address",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "recipient",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "amount",
            type: "core::integer::u128",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "save",
        type: "function",
        inputs: [
          {
            name: "key",
            type: "ekubo::types::keys::SavedBalanceKey",
          },
          {
            name: "amount",
            type: "core::integer::u128",
          },
        ],
        outputs: [
          {
            type: "core::integer::u128",
          },
        ],
        state_mutability: "external",
      },
      {
        name: "pay",
        type: "function",
        inputs: [
          {
            name: "token_address",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "load",
        type: "function",
        inputs: [
          {
            name: "token",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "salt",
            type: "core::felt252",
          },
          {
            name: "amount",
            type: "core::integer::u128",
          },
        ],
        outputs: [
          {
            type: "core::integer::u128",
          },
        ],
        state_mutability: "external",
      },
      {
        name: "initialize_pool",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
          {
            name: "initial_tick",
            type: "ekubo::types::i129::i129",
          },
        ],
        outputs: [
          {
            type: "core::integer::u256",
          },
        ],
        state_mutability: "external",
      },
      {
        name: "maybe_initialize_pool",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
          {
            name: "initial_tick",
            type: "ekubo::types::i129::i129",
          },
        ],
        outputs: [
          {
            type: "core::option::Option::<core::integer::u256>",
          },
        ],
        state_mutability: "external",
      },
      {
        name: "update_position",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
          {
            name: "params",
            type: "ekubo::interfaces::core::UpdatePositionParameters",
          },
        ],
        outputs: [
          {
            type: "ekubo::types::delta::Delta",
          },
        ],
        state_mutability: "external",
      },
      {
        name: "collect_fees",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
          {
            name: "salt",
            type: "core::felt252",
          },
          {
            name: "bounds",
            type: "ekubo::types::bounds::Bounds",
          },
        ],
        outputs: [
          {
            type: "ekubo::types::delta::Delta",
          },
        ],
        state_mutability: "external",
      },
      {
        name: "swap",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
          {
            name: "params",
            type: "ekubo::interfaces::core::SwapParameters",
          },
        ],
        outputs: [
          {
            type: "ekubo::types::delta::Delta",
          },
        ],
        state_mutability: "external",
      },
      {
        name: "accumulate_as_fees",
        type: "function",
        inputs: [
          {
            name: "pool_key",
            type: "ekubo::types::keys::PoolKey",
          },
          {
            name: "amount0",
            type: "core::integer::u128",
          },
          {
            name: "amount1",
            type: "core::integer::u128",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
    ],
  },
  {
    name: "Owned",
    type: "impl",
    interface_name: "ekubo::components::owned::IOwned",
  },
  {
    name: "ekubo::components::owned::IOwned",
    type: "interface",
    items: [
      {
        name: "get_owner",
        type: "function",
        inputs: [],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "transfer_ownership",
        type: "function",
        inputs: [
          {
            name: "new_owner",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
    ],
  },
  {
    name: "Upgradeable",
    type: "impl",
    interface_name: "ekubo::interfaces::upgradeable::IUpgradeable",
  },
  {
    name: "ekubo::interfaces::upgradeable::IUpgradeable",
    type: "interface",
    items: [
      {
        name: "replace_class_hash",
        type: "function",
        inputs: [
          {
            name: "class_hash",
            type: "core::starknet::class_hash::ClassHash",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
    ],
  },
  {
    name: "constructor",
    type: "constructor",
    inputs: [
      {
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "ekubo::components::upgradeable::Upgradeable::ClassHashReplaced",
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
    name: "ekubo::components::upgradeable::Upgradeable::Event",
    type: "event",
    variants: [
      {
        kind: "nested",
        name: "ClassHashReplaced",
        type: "ekubo::components::upgradeable::Upgradeable::ClassHashReplaced",
      },
    ],
  },
  {
    kind: "struct",
    name: "ekubo::components::owned::Owned::OwnershipTransferred",
    type: "event",
    members: [
      {
        kind: "data",
        name: "old_owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "new_owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "enum",
    name: "ekubo::components::owned::Owned::Event",
    type: "event",
    variants: [
      {
        kind: "nested",
        name: "OwnershipTransferred",
        type: "ekubo::components::owned::Owned::OwnershipTransferred",
      },
    ],
  },
  {
    kind: "struct",
    name: "ekubo::core::Core::ProtocolFeesPaid",
    type: "event",
    members: [
      {
        kind: "data",
        name: "pool_key",
        type: "ekubo::types::keys::PoolKey",
      },
      {
        kind: "data",
        name: "position_key",
        type: "ekubo::types::keys::PositionKey",
      },
      {
        kind: "data",
        name: "delta",
        type: "ekubo::types::delta::Delta",
      },
    ],
  },
  {
    kind: "struct",
    name: "ekubo::core::Core::ProtocolFeesWithdrawn",
    type: "event",
    members: [
      {
        kind: "data",
        name: "recipient",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "token",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "amount",
        type: "core::integer::u128",
      },
    ],
  },
  {
    kind: "struct",
    name: "ekubo::core::Core::PoolInitialized",
    type: "event",
    members: [
      {
        kind: "data",
        name: "pool_key",
        type: "ekubo::types::keys::PoolKey",
      },
      {
        kind: "data",
        name: "initial_tick",
        type: "ekubo::types::i129::i129",
      },
      {
        kind: "data",
        name: "sqrt_ratio",
        type: "core::integer::u256",
      },
      {
        kind: "data",
        name: "call_points",
        type: "core::integer::u8",
      },
    ],
  },
  {
    kind: "struct",
    name: "ekubo::core::Core::PositionUpdated",
    type: "event",
    members: [
      {
        kind: "data",
        name: "locker",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "pool_key",
        type: "ekubo::types::keys::PoolKey",
      },
      {
        kind: "data",
        name: "params",
        type: "ekubo::interfaces::core::UpdatePositionParameters",
      },
      {
        kind: "data",
        name: "delta",
        type: "ekubo::types::delta::Delta",
      },
    ],
  },
  {
    kind: "struct",
    name: "ekubo::core::Core::PositionFeesCollected",
    type: "event",
    members: [
      {
        kind: "data",
        name: "pool_key",
        type: "ekubo::types::keys::PoolKey",
      },
      {
        kind: "data",
        name: "position_key",
        type: "ekubo::types::keys::PositionKey",
      },
      {
        kind: "data",
        name: "delta",
        type: "ekubo::types::delta::Delta",
      },
    ],
  },
  {
    kind: "struct",
    name: "ekubo::core::Core::Swapped",
    type: "event",
    members: [
      {
        kind: "data",
        name: "locker",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "pool_key",
        type: "ekubo::types::keys::PoolKey",
      },
      {
        kind: "data",
        name: "params",
        type: "ekubo::interfaces::core::SwapParameters",
      },
      {
        kind: "data",
        name: "delta",
        type: "ekubo::types::delta::Delta",
      },
      {
        kind: "data",
        name: "sqrt_ratio_after",
        type: "core::integer::u256",
      },
      {
        kind: "data",
        name: "tick_after",
        type: "ekubo::types::i129::i129",
      },
      {
        kind: "data",
        name: "liquidity_after",
        type: "core::integer::u128",
      },
    ],
  },
  {
    kind: "struct",
    name: "ekubo::core::Core::SavedBalance",
    type: "event",
    members: [
      {
        kind: "data",
        name: "key",
        type: "ekubo::types::keys::SavedBalanceKey",
      },
      {
        kind: "data",
        name: "amount",
        type: "core::integer::u128",
      },
    ],
  },
  {
    kind: "struct",
    name: "ekubo::core::Core::LoadedBalance",
    type: "event",
    members: [
      {
        kind: "data",
        name: "key",
        type: "ekubo::types::keys::SavedBalanceKey",
      },
      {
        kind: "data",
        name: "amount",
        type: "core::integer::u128",
      },
    ],
  },
  {
    kind: "struct",
    name: "ekubo::core::Core::FeesAccumulated",
    type: "event",
    members: [
      {
        kind: "data",
        name: "pool_key",
        type: "ekubo::types::keys::PoolKey",
      },
      {
        kind: "data",
        name: "amount0",
        type: "core::integer::u128",
      },
      {
        kind: "data",
        name: "amount1",
        type: "core::integer::u128",
      },
    ],
  },
  {
    kind: "enum",
    name: "ekubo::core::Core::Event",
    type: "event",
    variants: [
      {
        kind: "flat",
        name: "UpgradeableEvent",
        type: "ekubo::components::upgradeable::Upgradeable::Event",
      },
      {
        kind: "nested",
        name: "OwnedEvent",
        type: "ekubo::components::owned::Owned::Event",
      },
      {
        kind: "nested",
        name: "ProtocolFeesPaid",
        type: "ekubo::core::Core::ProtocolFeesPaid",
      },
      {
        kind: "nested",
        name: "ProtocolFeesWithdrawn",
        type: "ekubo::core::Core::ProtocolFeesWithdrawn",
      },
      {
        kind: "nested",
        name: "PoolInitialized",
        type: "ekubo::core::Core::PoolInitialized",
      },
      {
        kind: "nested",
        name: "PositionUpdated",
        type: "ekubo::core::Core::PositionUpdated",
      },
      {
        kind: "nested",
        name: "PositionFeesCollected",
        type: "ekubo::core::Core::PositionFeesCollected",
      },
      {
        kind: "nested",
        name: "Swapped",
        type: "ekubo::core::Core::Swapped",
      },
      {
        kind: "nested",
        name: "SavedBalance",
        type: "ekubo::core::Core::SavedBalance",
      },
      {
        kind: "nested",
        name: "LoadedBalance",
        type: "ekubo::core::Core::LoadedBalance",
      },
      {
        kind: "nested",
        name: "FeesAccumulated",
        type: "ekubo::core::Core::FeesAccumulated",
      },
    ],
  },
] as const satisfies Abi;
