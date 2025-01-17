import type { Abi } from "abi-wan-kanabi";

export const chainlinkAbi = [
  {
    name: "chainlink::ocr2::aggregator::Round",
    type: "struct",
    members: [
      {
        name: "round_id",
        type: "core::felt252",
      },
      {
        name: "answer",
        type: "core::integer::u128",
      },
      {
        name: "block_num",
        type: "core::integer::u64",
      },
      {
        name: "started_at",
        type: "core::integer::u64",
      },
      {
        name: "updated_at",
        type: "core::integer::u64",
      },
    ],
  },
  {
    name: "chainlink::ocr2::aggregator::OracleConfig",
    type: "struct",
    members: [
      {
        name: "signer",
        type: "core::felt252",
      },
      {
        name: "transmitter",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    name: "latest_transmission_details",
    type: "function",
    inputs: [],
    outputs: [
      {
        type: "(core::felt252, core::integer::u64, core::integer::u128, core::integer::u64)",
      },
    ],
    state_mutability: "view",
  },
  {
    name: "chainlink::ocr2::aggregator::Aggregator::ReportContext",
    type: "struct",
    members: [
      {
        name: "config_digest",
        type: "core::felt252",
      },
      {
        name: "epoch_and_round",
        type: "core::integer::u64",
      },
      {
        name: "extra_hash",
        type: "core::felt252",
      },
    ],
  },
  {
    name: "chainlink::ocr2::aggregator::Aggregator::Signature",
    type: "struct",
    members: [
      {
        name: "r",
        type: "core::felt252",
      },
      {
        name: "s",
        type: "core::felt252",
      },
      {
        name: "public_key",
        type: "core::felt252",
      },
    ],
  },
  {
    name: "transmit",
    type: "function",
    inputs: [
      {
        name: "report_context",
        type: "chainlink::ocr2::aggregator::Aggregator::ReportContext",
      },
      {
        name: "observation_timestamp",
        type: "core::integer::u64",
      },
      {
        name: "observers",
        type: "core::felt252",
      },
      {
        name: "observations",
        type: "core::array::Array::<core::integer::u128>",
      },
      {
        name: "juels_per_fee_coin",
        type: "core::integer::u128",
      },
      {
        name: "gas_price",
        type: "core::integer::u128",
      },
      {
        name: "signatures",
        type: "core::array::Array::<chainlink::ocr2::aggregator::Aggregator::Signature>",
      },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    name: "chainlink::ocr2::aggregator::Aggregator::BillingConfig",
    type: "struct",
    members: [
      {
        name: "observation_payment_gjuels",
        type: "core::integer::u32",
      },
      {
        name: "transmission_payment_gjuels",
        type: "core::integer::u32",
      },
      {
        name: "gas_base",
        type: "core::integer::u32",
      },
      {
        name: "gas_per_signature",
        type: "core::integer::u32",
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
    name: "chainlink::ocr2::aggregator::PayeeConfig",
    type: "struct",
    members: [
      {
        name: "transmitter",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "payee",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "openzeppelin::access::ownable::ownable::OwnableComponent::OwnershipTransferred",
    type: "event",
    members: [
      {
        kind: "key",
        name: "previous_owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "new_owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "openzeppelin::access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
    type: "event",
    members: [
      {
        kind: "key",
        name: "previous_owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "new_owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "enum",
    name: "openzeppelin::access::ownable::ownable::OwnableComponent::Event",
    type: "event",
    variants: [
      {
        kind: "nested",
        name: "OwnershipTransferred",
        type: "openzeppelin::access::ownable::ownable::OwnableComponent::OwnershipTransferred",
      },
      {
        kind: "nested",
        name: "OwnershipTransferStarted",
        type: "openzeppelin::access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
      },
    ],
  },
  {
    kind: "struct",
    name: "chainlink::libraries::access_control::AccessControlComponent::AddedAccess",
    type: "event",
    members: [
      {
        kind: "key",
        name: "user",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "chainlink::libraries::access_control::AccessControlComponent::RemovedAccess",
    type: "event",
    members: [
      {
        kind: "key",
        name: "user",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "chainlink::libraries::access_control::AccessControlComponent::AccessControlEnabled",
    type: "event",
    members: [],
  },
  {
    kind: "struct",
    name: "chainlink::libraries::access_control::AccessControlComponent::AccessControlDisabled",
    type: "event",
    members: [],
  },
  {
    kind: "enum",
    name: "chainlink::libraries::access_control::AccessControlComponent::Event",
    type: "event",
    variants: [
      {
        kind: "nested",
        name: "AddedAccess",
        type: "chainlink::libraries::access_control::AccessControlComponent::AddedAccess",
      },
      {
        kind: "nested",
        name: "RemovedAccess",
        type: "chainlink::libraries::access_control::AccessControlComponent::RemovedAccess",
      },
      {
        kind: "nested",
        name: "AccessControlEnabled",
        type: "chainlink::libraries::access_control::AccessControlComponent::AccessControlEnabled",
      },
      {
        kind: "nested",
        name: "AccessControlDisabled",
        type: "chainlink::libraries::access_control::AccessControlComponent::AccessControlDisabled",
      },
    ],
  },
  {
    kind: "struct",
    name: "chainlink::ocr2::aggregator::Aggregator::NewTransmission",
    type: "event",
    members: [
      {
        kind: "key",
        name: "round_id",
        type: "core::integer::u128",
      },
      {
        kind: "data",
        name: "answer",
        type: "core::integer::u128",
      },
      {
        kind: "key",
        name: "transmitter",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "observation_timestamp",
        type: "core::integer::u64",
      },
      {
        kind: "data",
        name: "observers",
        type: "core::felt252",
      },
      {
        kind: "data",
        name: "observations",
        type: "core::array::Array::<core::integer::u128>",
      },
      {
        kind: "data",
        name: "juels_per_fee_coin",
        type: "core::integer::u128",
      },
      {
        kind: "data",
        name: "gas_price",
        type: "core::integer::u128",
      },
      {
        kind: "data",
        name: "config_digest",
        type: "core::felt252",
      },
      {
        kind: "data",
        name: "epoch_and_round",
        type: "core::integer::u64",
      },
      {
        kind: "data",
        name: "reimbursement",
        type: "core::integer::u128",
      },
    ],
  },
  {
    kind: "struct",
    name: "chainlink::ocr2::aggregator::Aggregator::ConfigSet",
    type: "event",
    members: [
      {
        kind: "key",
        name: "previous_config_block_number",
        type: "core::integer::u64",
      },
      {
        kind: "key",
        name: "latest_config_digest",
        type: "core::felt252",
      },
      {
        kind: "data",
        name: "config_count",
        type: "core::integer::u64",
      },
      {
        kind: "data",
        name: "oracles",
        type: "core::array::Array::<chainlink::ocr2::aggregator::OracleConfig>",
      },
      {
        kind: "data",
        name: "f",
        type: "core::integer::u8",
      },
      {
        kind: "data",
        name: "onchain_config",
        type: "core::array::Array::<core::felt252>",
      },
      {
        kind: "data",
        name: "offchain_config_version",
        type: "core::integer::u64",
      },
      {
        kind: "data",
        name: "offchain_config",
        type: "core::array::Array::<core::felt252>",
      },
    ],
  },
  {
    kind: "struct",
    name: "chainlink::ocr2::aggregator::Aggregator::LinkTokenSet",
    type: "event",
    members: [
      {
        kind: "key",
        name: "old_link_token",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "new_link_token",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "chainlink::ocr2::aggregator::Aggregator::BillingAccessControllerSet",
    type: "event",
    members: [
      {
        kind: "key",
        name: "old_controller",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "new_controller",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "chainlink::ocr2::aggregator::Aggregator::BillingSet",
    type: "event",
    members: [
      {
        kind: "data",
        name: "config",
        type: "chainlink::ocr2::aggregator::Aggregator::BillingConfig",
      },
    ],
  },
  {
    kind: "struct",
    name: "chainlink::ocr2::aggregator::Aggregator::OraclePaid",
    type: "event",
    members: [
      {
        kind: "key",
        name: "transmitter",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "payee",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "amount",
        type: "core::integer::u256",
      },
      {
        kind: "data",
        name: "link_token",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "chainlink::ocr2::aggregator::Aggregator::PayeeshipTransferRequested",
    type: "event",
    members: [
      {
        kind: "key",
        name: "transmitter",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "current",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "proposed",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "chainlink::ocr2::aggregator::Aggregator::PayeeshipTransferred",
    type: "event",
    members: [
      {
        kind: "key",
        name: "transmitter",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "previous",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "current",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "enum",
    name: "chainlink::ocr2::aggregator::Aggregator::Event",
    type: "event",
    variants: [
      {
        kind: "flat",
        name: "OwnableEvent",
        type: "openzeppelin::access::ownable::ownable::OwnableComponent::Event",
      },
      {
        kind: "flat",
        name: "AccessControlEvent",
        type: "chainlink::libraries::access_control::AccessControlComponent::Event",
      },
      {
        kind: "nested",
        name: "NewTransmission",
        type: "chainlink::ocr2::aggregator::Aggregator::NewTransmission",
      },
      {
        kind: "nested",
        name: "ConfigSet",
        type: "chainlink::ocr2::aggregator::Aggregator::ConfigSet",
      },
      {
        kind: "nested",
        name: "LinkTokenSet",
        type: "chainlink::ocr2::aggregator::Aggregator::LinkTokenSet",
      },
      {
        kind: "nested",
        name: "BillingAccessControllerSet",
        type: "chainlink::ocr2::aggregator::Aggregator::BillingAccessControllerSet",
      },
      {
        kind: "nested",
        name: "BillingSet",
        type: "chainlink::ocr2::aggregator::Aggregator::BillingSet",
      },
      {
        kind: "nested",
        name: "OraclePaid",
        type: "chainlink::ocr2::aggregator::Aggregator::OraclePaid",
      },
      {
        kind: "nested",
        name: "PayeeshipTransferRequested",
        type: "chainlink::ocr2::aggregator::Aggregator::PayeeshipTransferRequested",
      },
      {
        kind: "nested",
        name: "PayeeshipTransferred",
        type: "chainlink::ocr2::aggregator::Aggregator::PayeeshipTransferred",
      },
    ],
  },
] as const satisfies Abi;
