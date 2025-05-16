import type { Abi } from "../../src/index";

export const paymentAbi = [
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
    kind: "struct",
    name: "my_pay::contract::MyPay::TokenAdded",
    type: "event",
    members: [
      {
        kind: "data",
        name: "token",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "my_pay::contract::MyPay::TokenRemoved",
    type: "event",
    members: [
      {
        kind: "data",
        name: "token",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "my_pay::contract::MyPay::PaymentReceived",
    type: "event",
    members: [
      {
        kind: "data",
        name: "sender",
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
        type: "core::integer::u256",
      },
      {
        kind: "data",
        name: "reference",
        type: "core::byte_array::ByteArray",
      },
    ],
  },
  {
    kind: "enum",
    name: "my_pay::contract::MyPay::Event",
    type: "event",
    variants: [
      {
        kind: "nested",
        name: "TokenAdded",
        type: "my_pay::contract::MyPay::TokenAdded",
      },
      {
        kind: "nested",
        name: "TokenRemoved",
        type: "my_pay::contract::MyPay::TokenRemoved",
      },
      {
        kind: "nested",
        name: "PaymentReceived",
        type: "my_pay::contract::MyPay::PaymentReceived",
      },
    ],
  },
] as const satisfies Abi;
