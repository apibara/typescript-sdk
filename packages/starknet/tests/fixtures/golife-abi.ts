import type { Abi } from "../../src/index";

export const golifeAbi = [
  {
    name: "GolLifeFormsImpl",
    type: "impl",
    interface_name: "gol_starknet::interfaces::IGolLifeForms",
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
    name: "gol_starknet::interfaces::LifeFormData",
    type: "struct",
    members: [
      {
        name: "is_loop",
        type: "core::bool",
      },
      {
        name: "is_still",
        type: "core::bool",
      },
      {
        name: "is_alive",
        type: "core::bool",
      },
      {
        name: "is_dead",
        type: "core::bool",
      },
      {
        name: "sequence_length",
        type: "core::integer::u32",
      },
      {
        name: "current_state",
        type: "core::integer::u256",
      },
      {
        name: "age",
        type: "core::integer::u32",
      },
    ],
  },
  {
    name: "gol_starknet::interfaces::IGolLifeForms",
    type: "interface",
    items: [
      {
        name: "mint",
        type: "function",
        inputs: [
          {
            name: "recipient",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "minter",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "token_id",
            type: "core::integer::u256",
          },
          {
            name: "lifeform_data",
            type: "gol_starknet::interfaces::LifeFormData",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "get_lifeform_data",
        type: "function",
        inputs: [
          {
            name: "token_id",
            type: "core::integer::u256",
          },
        ],
        outputs: [
          {
            type: "gol_starknet::interfaces::LifeFormData",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "move_lifeform_forward",
        type: "function",
        inputs: [
          {
            name: "token_id",
            type: "core::integer::u256",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "get_nutrient_contract_address",
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
    name: "UpgradeableImpl",
    type: "impl",
    interface_name: "openzeppelin_upgrades::interface::IUpgradeable",
  },
  {
    name: "openzeppelin_upgrades::interface::IUpgradeable",
    type: "interface",
    items: [
      {
        name: "upgrade",
        type: "function",
        inputs: [
          {
            name: "new_class_hash",
            type: "core::starknet::class_hash::ClassHash",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
    ],
  },
  {
    name: "ERC721MixinImpl",
    type: "impl",
    interface_name: "openzeppelin_token::erc721::interface::ERC721ABI",
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
    name: "core::byte_array::ByteArray",
    type: "struct",
    members: [
      {
        name: "data",
        type: "core::array::Array::<core::bytes_31::bytes31>",
      },
      {
        name: "pending_word",
        type: "core::felt252",
      },
      {
        name: "pending_word_len",
        type: "core::integer::u32",
      },
    ],
  },
  {
    name: "openzeppelin_token::erc721::interface::ERC721ABI",
    type: "interface",
    items: [
      {
        name: "balance_of",
        type: "function",
        inputs: [
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [
          {
            type: "core::integer::u256",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "owner_of",
        type: "function",
        inputs: [
          {
            name: "token_id",
            type: "core::integer::u256",
          },
        ],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "safe_transfer_from",
        type: "function",
        inputs: [
          {
            name: "from",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "to",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "token_id",
            type: "core::integer::u256",
          },
          {
            name: "data",
            type: "core::array::Span::<core::felt252>",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "transfer_from",
        type: "function",
        inputs: [
          {
            name: "from",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "to",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "token_id",
            type: "core::integer::u256",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "approve",
        type: "function",
        inputs: [
          {
            name: "to",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "token_id",
            type: "core::integer::u256",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "set_approval_for_all",
        type: "function",
        inputs: [
          {
            name: "operator",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "approved",
            type: "core::bool",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "get_approved",
        type: "function",
        inputs: [
          {
            name: "token_id",
            type: "core::integer::u256",
          },
        ],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "is_approved_for_all",
        type: "function",
        inputs: [
          {
            name: "owner",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "operator",
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
        name: "supports_interface",
        type: "function",
        inputs: [
          {
            name: "interface_id",
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
        name: "name",
        type: "function",
        inputs: [],
        outputs: [
          {
            type: "core::byte_array::ByteArray",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "symbol",
        type: "function",
        inputs: [],
        outputs: [
          {
            type: "core::byte_array::ByteArray",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "token_uri",
        type: "function",
        inputs: [
          {
            name: "token_id",
            type: "core::integer::u256",
          },
        ],
        outputs: [
          {
            type: "core::byte_array::ByteArray",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "balanceOf",
        type: "function",
        inputs: [
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [
          {
            type: "core::integer::u256",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "ownerOf",
        type: "function",
        inputs: [
          {
            name: "tokenId",
            type: "core::integer::u256",
          },
        ],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "safeTransferFrom",
        type: "function",
        inputs: [
          {
            name: "from",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "to",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "tokenId",
            type: "core::integer::u256",
          },
          {
            name: "data",
            type: "core::array::Span::<core::felt252>",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "transferFrom",
        type: "function",
        inputs: [
          {
            name: "from",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "to",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "tokenId",
            type: "core::integer::u256",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "setApprovalForAll",
        type: "function",
        inputs: [
          {
            name: "operator",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "approved",
            type: "core::bool",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "getApproved",
        type: "function",
        inputs: [
          {
            name: "tokenId",
            type: "core::integer::u256",
          },
        ],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "isApprovedForAll",
        type: "function",
        inputs: [
          {
            name: "owner",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "operator",
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
        name: "tokenURI",
        type: "function",
        inputs: [
          {
            name: "tokenId",
            type: "core::integer::u256",
          },
        ],
        outputs: [
          {
            type: "core::byte_array::ByteArray",
          },
        ],
        state_mutability: "view",
      },
    ],
  },
  {
    name: "AccessControlImpl",
    type: "impl",
    interface_name:
      "openzeppelin_access::accesscontrol::interface::IAccessControl",
  },
  {
    name: "openzeppelin_access::accesscontrol::interface::IAccessControl",
    type: "interface",
    items: [
      {
        name: "has_role",
        type: "function",
        inputs: [
          {
            name: "role",
            type: "core::felt252",
          },
          {
            name: "account",
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
        name: "get_role_admin",
        type: "function",
        inputs: [
          {
            name: "role",
            type: "core::felt252",
          },
        ],
        outputs: [
          {
            type: "core::felt252",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "grant_role",
        type: "function",
        inputs: [
          {
            name: "role",
            type: "core::felt252",
          },
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "revoke_role",
        type: "function",
        inputs: [
          {
            name: "role",
            type: "core::felt252",
          },
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "renounce_role",
        type: "function",
        inputs: [
          {
            name: "role",
            type: "core::felt252",
          },
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
    ],
  },
  {
    name: "GolUtilitiesImpl",
    type: "impl",
    interface_name: "gol_starknet::interfaces::IGolUtilities",
  },
  {
    name: "gol_starknet::interfaces::PartialPathData",
    type: "struct",
    members: [
      {
        name: "entrypoint",
        type: "core::integer::u256",
      },
      {
        name: "exitpoint",
        type: "core::integer::u256",
      },
      {
        name: "length",
        type: "core::integer::u32",
      },
      {
        name: "trigger_state",
        type: "core::integer::u256",
      },
      {
        name: "smallest_element",
        type: "core::integer::u256",
      },
    ],
  },
  {
    name: "gol_starknet::interfaces::IGolUtilities",
    type: "interface",
    items: [
      {
        name: "unpack_grid_from_uint",
        type: "function",
        inputs: [
          {
            name: "state",
            type: "core::integer::u256",
          },
        ],
        outputs: [
          {
            type: "core::array::Array::<core::array::Array::<core::bool>>",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "pack_grid_in_uint",
        type: "function",
        inputs: [
          {
            name: "grid",
            type: "core::array::Array::<core::array::Array::<core::bool>>",
          },
        ],
        outputs: [
          {
            type: "core::integer::u256",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "iterate_life_once",
        type: "function",
        inputs: [
          {
            name: "initial_state",
            type: "core::integer::u256",
          },
        ],
        outputs: [
          {
            type: "core::integer::u256",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "iterate_life_several_times",
        type: "function",
        inputs: [
          {
            name: "initial_state",
            type: "core::integer::u256",
          },
          {
            name: "generations",
            type: "core::integer::u32",
          },
        ],
        outputs: [
          {
            type: "core::array::Array::<core::integer::u256>",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "iterate_life_several_times_enhanced",
        type: "function",
        inputs: [
          {
            name: "initial_state",
            type: "core::integer::u256",
          },
          {
            name: "trigger_state",
            type: "core::integer::u256",
          },
          {
            name: "generations",
            type: "core::integer::u32",
          },
        ],
        outputs: [
          {
            type: "(core::bool, core::integer::u256, core::array::Array::<core::integer::u256>)",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "is_single_loop_from_initial_state",
        type: "function",
        inputs: [
          {
            name: "initial_state",
            type: "core::integer::u256",
          },
          {
            name: "generations",
            type: "core::integer::u32",
          },
        ],
        outputs: [
          {
            type: "(core::bool, core::integer::u256, core::array::Array::<core::integer::u256>)",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "is_single_loop_and_entrypoint_is_smallest_from_initial_state",
        type: "function",
        inputs: [
          {
            name: "initial_state",
            type: "core::integer::u256",
          },
          {
            name: "generations",
            type: "core::integer::u32",
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
        name: "compute_partial_path",
        type: "function",
        inputs: [
          {
            name: "initial_state",
            type: "core::integer::u256",
          },
          {
            name: "trigger_state",
            type: "core::integer::u256",
          },
          {
            name: "generations",
            type: "core::integer::u32",
          },
        ],
        outputs: [
          {
            type: "gol_starknet::interfaces::PartialPathData",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "combine_partial_path",
        type: "function",
        inputs: [
          {
            name: "partial_path_1",
            type: "gol_starknet::interfaces::PartialPathData",
          },
          {
            name: "partial_path_2",
            type: "gol_starknet::interfaces::PartialPathData",
          },
        ],
        outputs: [
          {
            type: "gol_starknet::interfaces::PartialPathData",
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
        name: "creator",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    name: "update_nutrient_contract_address",
    type: "function",
    inputs: [
      {
        name: "nutrient_contract_address",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    name: "update_loop_minter_contract",
    type: "function",
    inputs: [
      {
        name: "loop_minter_contract",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    name: "update_path_minter_contract",
    type: "function",
    inputs: [
      {
        name: "path_minter_contract",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    kind: "struct",
    name: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer",
    type: "event",
    members: [
      {
        kind: "key",
        name: "from",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "to",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "token_id",
        type: "core::integer::u256",
      },
    ],
  },
  {
    kind: "struct",
    name: "openzeppelin_token::erc721::erc721::ERC721Component::Approval",
    type: "event",
    members: [
      {
        kind: "key",
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "approved",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "token_id",
        type: "core::integer::u256",
      },
    ],
  },
  {
    kind: "struct",
    name: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll",
    type: "event",
    members: [
      {
        kind: "key",
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "operator",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "approved",
        type: "core::bool",
      },
    ],
  },
  {
    kind: "enum",
    name: "openzeppelin_token::erc721::erc721::ERC721Component::Event",
    type: "event",
    variants: [
      {
        kind: "nested",
        name: "Transfer",
        type: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer",
      },
      {
        kind: "nested",
        name: "Approval",
        type: "openzeppelin_token::erc721::erc721::ERC721Component::Approval",
      },
      {
        kind: "nested",
        name: "ApprovalForAll",
        type: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll",
      },
    ],
  },
  {
    kind: "enum",
    name: "openzeppelin_introspection::src5::SRC5Component::Event",
    type: "event",
    variants: [],
  },
  {
    kind: "struct",
    name: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGranted",
    type: "event",
    members: [
      {
        kind: "data",
        name: "role",
        type: "core::felt252",
      },
      {
        kind: "data",
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "sender",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleRevoked",
    type: "event",
    members: [
      {
        kind: "data",
        name: "role",
        type: "core::felt252",
      },
      {
        kind: "data",
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "sender",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleAdminChanged",
    type: "event",
    members: [
      {
        kind: "data",
        name: "role",
        type: "core::felt252",
      },
      {
        kind: "data",
        name: "previous_admin_role",
        type: "core::felt252",
      },
      {
        kind: "data",
        name: "new_admin_role",
        type: "core::felt252",
      },
    ],
  },
  {
    kind: "enum",
    name: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::Event",
    type: "event",
    variants: [
      {
        kind: "nested",
        name: "RoleGranted",
        type: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGranted",
      },
      {
        kind: "nested",
        name: "RoleRevoked",
        type: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleRevoked",
      },
      {
        kind: "nested",
        name: "RoleAdminChanged",
        type: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleAdminChanged",
      },
    ],
  },
  {
    kind: "struct",
    name: "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Upgraded",
    type: "event",
    members: [
      {
        kind: "data",
        name: "class_hash",
        type: "core::starknet::class_hash::ClassHash",
      },
    ],
  },
  {
    kind: "enum",
    name: "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Event",
    type: "event",
    variants: [
      {
        kind: "nested",
        name: "Upgraded",
        type: "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Upgraded",
      },
    ],
  },
  {
    kind: "enum",
    name: "gol_starknet::gol_utilities::GolUtilitiesComponent::Event",
    type: "event",
    variants: [],
  },
  {
    kind: "struct",
    name: "gol_starknet::gol_lifeforms::GolLifeforms::NewLifeFormEvent",
    type: "event",
    members: [
      {
        kind: "data",
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "token_id",
        type: "core::integer::u256",
      },
      {
        kind: "data",
        name: "lifeform_data",
        type: "gol_starknet::interfaces::LifeFormData",
      },
    ],
  },
  {
    kind: "struct",
    name: "gol_starknet::gol_lifeforms::GolLifeforms::NewMoveEvent",
    type: "event",
    members: [
      {
        kind: "data",
        name: "token_id",
        type: "core::integer::u256",
      },
      {
        kind: "data",
        name: "age",
        type: "core::integer::u32",
      },
    ],
  },
  {
    kind: "struct",
    name: "gol_starknet::gol_lifeforms::GolLifeforms::NutrientContractUpdatedEvent",
    type: "event",
    members: [
      {
        kind: "data",
        name: "nutrient_contract_address",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "enum",
    name: "gol_starknet::gol_lifeforms::GolLifeforms::Event",
    type: "event",
    variants: [
      {
        kind: "flat",
        name: "ERC721Event",
        type: "openzeppelin_token::erc721::erc721::ERC721Component::Event",
      },
      {
        kind: "flat",
        name: "SRC5Event",
        type: "openzeppelin_introspection::src5::SRC5Component::Event",
      },
      {
        kind: "flat",
        name: "AccessControlEvent",
        type: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::Event",
      },
      {
        kind: "flat",
        name: "UpgradeableEvent",
        type: "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Event",
      },
      {
        kind: "flat",
        name: "GolUtilitiesEvent",
        type: "gol_starknet::gol_utilities::GolUtilitiesComponent::Event",
      },
      {
        kind: "nested",
        name: "NewLifeForm",
        type: "gol_starknet::gol_lifeforms::GolLifeforms::NewLifeFormEvent",
      },
      {
        kind: "nested",
        name: "NewMove",
        type: "gol_starknet::gol_lifeforms::GolLifeforms::NewMoveEvent",
      },
      {
        kind: "nested",
        name: "NutrientContractUpdated",
        type: "gol_starknet::gol_lifeforms::GolLifeforms::NutrientContractUpdatedEvent",
      },
    ],
  },
] as const satisfies Abi;
