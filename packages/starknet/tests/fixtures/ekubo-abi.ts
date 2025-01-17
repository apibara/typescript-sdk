import type { Abi } from "abi-wan-kanabi";

export const ekuboAbi = [
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
    name: "core::array::Span::<core::felt252>",
    type: "struct",
    members: [
      {
        name: "snapshot",
        type: "@core::array::Array::<core::felt252>",
      },
    ],
  },
  {
    name: "ekubo::interfaces::core::IForwardeeDispatcher",
    type: "struct",
    members: [
      {
        name: "contract_address",
        type: "core::starknet::contract_address::ContractAddress",
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
    name: "ekubo::types::call_points::CallPoints",
    type: "struct",
    members: [
      {
        name: "before_initialize_pool",
        type: "core::bool",
      },
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
      {
        name: "before_collect_fees",
        type: "core::bool",
      },
      {
        name: "after_collect_fees",
        type: "core::bool",
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
