import type { Abi } from "../../src/index";

export const registryAbi = [
  {
    name: "IOlasCompetitionsRegistry",
    type: "impl",
    interface_name:
      "opinion_competitions::interfaces::IOlasCompetitionRegistry::IOlasCompetitionRegistry",
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
    name: "core::option::Option::<core::array::Span::<core::felt252>>",
    type: "enum",
    variants: [
      {
        name: "Some",
        type: "core::array::Span::<core::felt252>",
      },
      {
        name: "None",
        type: "()",
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
    name: "opinion_competitions::utils::common::enums::VerificationLevel",
    type: "enum",
    variants: [
      {
        name: "UNVERIFIED",
        type: "()",
      },
      {
        name: "ORB",
        type: "()",
      },
      {
        name: "DEVICE",
        type: "()",
      },
    ],
  },
  {
    name: "opinion_competitions::utils::common::structs::RegistryDetails",
    type: "struct",
    members: [
      {
        name: "is_registered",
        type: "core::bool",
      },
      {
        name: "username",
        type: "core::felt252",
      },
      {
        name: "verification_level",
        type: "opinion_competitions::utils::common::enums::VerificationLevel",
      },
      {
        name: "is_admin_verified",
        type: "core::bool",
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
    name: "opinion_competitions::interfaces::IOlasCompetitionRegistry::IOlasCompetitionRegistry",
    type: "interface",
    items: [
      {
        name: "register_user",
        type: "function",
        inputs: [
          {
            name: "user_address",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "username",
            type: "core::felt252",
          },
          {
            name: "full_proof_with_hints",
            type: "core::option::Option::<core::array::Span::<core::felt252>>",
          },
        ],
        outputs: [
          {
            type: "core::bool",
          },
        ],
        state_mutability: "external",
      },
      {
        name: "mark_user_as_device_verified",
        type: "function",
        inputs: [
          {
            name: "user_address",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [
          {
            type: "core::bool",
          },
        ],
        state_mutability: "external",
      },
      {
        name: "update_admin",
        type: "function",
        inputs: [
          {
            name: "new_admin",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [
          {
            type: "core::bool",
          },
        ],
        state_mutability: "external",
      },
      {
        name: "update_trusted_entities",
        type: "function",
        inputs: [
          {
            name: "entity",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "is_trusted",
            type: "core::bool",
          },
        ],
        outputs: [
          {
            type: "core::bool",
          },
        ],
        state_mutability: "external",
      },
      {
        name: "use_voting_power",
        type: "function",
        inputs: [
          {
            name: "user",
            type: "core::starknet::contract_address::ContractAddress",
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
        name: "add_voting_power",
        type: "function",
        inputs: [
          {
            name: "user",
            type: "core::starknet::contract_address::ContractAddress",
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
        name: "get_user_details",
        type: "function",
        inputs: [
          {
            name: "user",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [
          {
            type: "opinion_competitions::utils::common::structs::RegistryDetails",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "is_nullifier_used",
        type: "function",
        inputs: [
          {
            name: "nullifier_hash",
            type: "core::integer::u256",
          },
        ],
        outputs: [
          {
            type: "core::bool",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "is_trusted_entity",
        type: "function",
        inputs: [
          {
            name: "entity",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [
          {
            type: "core::bool",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "is_username_taken",
        type: "function",
        inputs: [
          {
            name: "username",
            type: "core::felt252",
          },
        ],
        outputs: [
          {
            type: "core::bool",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "get_initial_voting_power",
        type: "function",
        inputs: [],
        outputs: [
          {
            type: "core::integer::u128",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "get_voting_power",
        type: "function",
        inputs: [
          {
            name: "user",
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
        name: "world_bridge_address",
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
        name: "registry_admin",
        type: "function",
        inputs: [],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        state_mutability: "view",
      },
    ],
  },
  {
    name: "constructor",
    type: "constructor",
    inputs: [
      {
        name: "bridge",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "initial_voting_power",
        type: "core::integer::u128",
      },
      {
        name: "admin",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "opinion_competitions::utils::common::events::UserRegistered",
    type: "event",
    members: [
      {
        kind: "key",
        name: "user",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "username",
        type: "core::felt252",
      },
      {
        kind: "data",
        name: "timestamp",
        type: "core::integer::u64",
      },
      {
        kind: "data",
        name: "verification_level",
        type: "opinion_competitions::utils::common::enums::VerificationLevel",
      },
    ],
  },
  {
    kind: "struct",
    name: "opinion_competitions::utils::common::events::AdminUpdated",
    type: "event",
    members: [
      {
        kind: "data",
        name: "prev_admin",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "new_admin",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "enum",
    name: "opinion_competitions::contracts::OlasCompetitionsRegistry::OlasCompetitionsRegistry::Event",
    type: "event",
    variants: [
      {
        kind: "nested",
        name: "UserRegistered",
        type: "opinion_competitions::utils::common::events::UserRegistered",
      },
      {
        kind: "nested",
        name: "AdminUpdated",
        type: "opinion_competitions::utils::common::events::AdminUpdated",
      },
    ],
  },
] as const satisfies Abi;
