import { describe, expect, it } from "vitest";

import type { Event } from "../src/block";
import { decodeEvent } from "../src/event";

import { getEventSelector } from "../src";
import { chainlinkAbi } from "./fixtures/chainlink-abi";
import { ekuboAbi } from "./fixtures/ekubo-abi";
import { golifeAbi } from "./fixtures/golife-abi";
import { paymentAbi } from "./fixtures/payment-abi";
import { registryAbi } from "./fixtures/registry-abi";

describe("decodeEvent", () => {
  describe("non strict mode", () => {
    it("returns null if the selector does not match", () => {
      const abi = ekuboAbi;

      const event = {
        transactionHash:
          "0x008691c1fa0f5c650b3492396dc1c22423c04e9a8843a12eaab03799d0a45cd0",
        address:
          "0x00000005dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b",
        keys: [
          "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        ],
        data: [
          "0x2e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067",
          "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
          "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
          "0x0",
          "0x3eb",
          "0x0",
          "0x111fcd",
          "0x129cfc1",
          "0x1",
          "0x129cbd6",
          "0x1",
          "0xe55231bfe9f8e3f",
          "0x0",
          "0x7c585087238003f8",
          "0x0",
          "0x0",
          "0x0",
        ],
        filterIds: [],
        eventIndex: 0,
        eventIndexInTransaction: 0,
        transactionIndex: 0,
        transactionStatus: "succeeded",
      } as const satisfies Event;

      const decoded = decodeEvent({
        abi,
        event,
        eventName: "ekubo::core::Core::PositionUpdated",
        strict: false,
      });

      expect(decoded).toBeNull();
    });

    it("returns null if parsing fails", () => {
      const abi = ekuboAbi;

      const event = {
        transactionHash:
          "0x008691c1fa0f5c650b3492396dc1c22423c04e9a8843a12eaab03799d0a45cd0",
        address:
          "0x00000005dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b",
        keys: [
          "0x3a7adca3546c213ce791fabf3b04090c163e419c808c9830fb343a4a395946e",
        ],
        data: [
          "0x2e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067",
          "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
          "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
          "0x0",
          "0x3eb",
          "0x0",
          "0x111fcd",
          "0x129cfc1",
          "0x1",
          "0x129cbd6",
          "0x1",
          "0xe55231bfe9f8e3f",
          "0x0",
          "0x7c585087238003f8",
          "0x0",
          "0x0",
        ],
        filterIds: [],
        eventIndex: 0,
        eventIndexInTransaction: 0,
        transactionIndex: 0,
        transactionStatus: "succeeded",
      } as const satisfies Event;

      const decoded = decodeEvent({
        abi,
        event,
        eventName: "ekubo::core::Core::PositionUpdated",
        strict: false,
      });

      expect(decoded).toBeNull();
    });
  });

  it("can handle events with nested structs", () => {
    const abi = ekuboAbi;

    const event = {
      transactionHash:
        "0x008691c1fa0f5c650b3492396dc1c22423c04e9a8843a12eaab03799d0a45cd0",
      address:
        "0x00000005dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b",
      keys: [
        "0x3a7adca3546c213ce791fabf3b04090c163e419c808c9830fb343a4a395946e",
      ],
      data: [
        "0x2e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067",
        "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
        "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
        "0x0",
        "0x3eb",
        "0x0",
        "0x111fcd",
        "0x129cfc1",
        "0x1",
        "0x129cbd6",
        "0x1",
        "0xe55231bfe9f8e3f",
        "0x0",
        "0x7c585087238003f8",
        "0x0",
        "0x0",
        "0x0",
      ],
      filterIds: [],
      eventIndex: 0,
      eventIndexInTransaction: 0,
      transactionIndex: 0,
      transactionStatus: "succeeded",
    } as const satisfies Event;

    const decoded = decodeEvent({
      abi,
      event,
      eventName: "ekubo::core::Core::PositionUpdated",
    });

    expect(decoded).toMatchInlineSnapshot(`
      {
        "address": "0x00000005dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b",
        "args": {
          "delta": {
            "amount0": {
              "mag": 8960000000000001016n,
              "sign": false,
            },
            "amount1": {
              "mag": 0n,
              "sign": false,
            },
          },
          "locker": "0x2e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067",
          "params": {
            "bounds": {
              "lower": {
                "mag": 19517377n,
                "sign": true,
              },
              "upper": {
                "mag": 19516374n,
                "sign": true,
              },
            },
            "liquidity_delta": {
              "mag": 1032770292694355519n,
              "sign": false,
            },
            "salt": 1122253n,
          },
          "pool_key": {
            "extension": "0x0",
            "fee": 0n,
            "tick_spacing": 1003n,
            "token0": "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
            "token1": "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
          },
        },
        "data": [
          "0x2e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067",
          "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
          "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
          "0x0",
          "0x3eb",
          "0x0",
          "0x111fcd",
          "0x129cfc1",
          "0x1",
          "0x129cbd6",
          "0x1",
          "0xe55231bfe9f8e3f",
          "0x0",
          "0x7c585087238003f8",
          "0x0",
          "0x0",
          "0x0",
        ],
        "eventIndex": 0,
        "eventIndexInTransaction": 0,
        "eventName": "ekubo::core::Core::PositionUpdated",
        "filterIds": [],
        "keys": [
          "0x3a7adca3546c213ce791fabf3b04090c163e419c808c9830fb343a4a395946e",
        ],
        "transactionHash": "0x008691c1fa0f5c650b3492396dc1c22423c04e9a8843a12eaab03799d0a45cd0",
        "transactionIndex": 0,
        "transactionStatus": "succeeded",
      }
    `);
  });

  it("can decode events with core::array::Array", () => {
    const abi = chainlinkAbi;

    const event = {
      transactionHash:
        "0x07021da0c8e9319d1144b0d56ed0bd86e46b15459cbb65c4dc0a05c8e274521d",
      address:
        "0x01b14326182638866e10d804d7a9e9fd51a522c8ac59ab9b1b11975d21fae9c7",
      keys: [
        "0x19e22f866f4c5aead2809bf160d2b29e921e335d899979732101c6f3c38ff81",
        "0x2b012",
        "0x1a4edc870eb8da3b73ab70d5dffc5c0a14a6ab1ad612845add04200582bffa4",
      ],
      data: [
        "0x2a5fa78",
        "0x678a24dd",
        "0x108060103050209000704000000000000000000000000000000000000000000",
        "0xa",
        "0x2a5580f",
        "0x2a5bf69",
        "0x2a5f992",
        "0x2a5f992",
        "0x2a5f992",
        "0x2a5fa78",
        "0x2a5fa78",
        "0x2a6096d",
        "0x2a6096d",
        "0x2a615fe",
        "0x0",
        "0x2d64b836639b",
        "0x40c03b6f80be73e1125f79855b79add29dbfc41d69bc79d8bb8b8e12dffc7",
        "0x1ee0005",
        "0x0",
      ],
      filterIds: [],
      eventIndex: 0,
      eventIndexInTransaction: 0,
      transactionIndex: 0,
      transactionStatus: "succeeded",
    } as const satisfies Event;

    const decoded = decodeEvent({
      abi,
      event,
      eventName: "chainlink::ocr2::aggregator::Aggregator::NewTransmission",
    });

    expect(decoded).toMatchInlineSnapshot(`
      {
        "address": "0x01b14326182638866e10d804d7a9e9fd51a522c8ac59ab9b1b11975d21fae9c7",
        "args": {
          "answer": 44431992n,
          "config_digest": 7150309363992519617890326180563923026411774849722293330735391938267971527n,
          "epoch_and_round": 32374789n,
          "gas_price": 49910610551707n,
          "juels_per_fee_coin": 0n,
          "observation_timestamp": 1737106653n,
          "observations": [
            44390415n,
            44416873n,
            44431762n,
            44431762n,
            44431762n,
            44431992n,
            44431992n,
            44435821n,
            44435821n,
            44439038n,
          ],
          "observers": 466489062857517899616354110882250443546418622745904306906528693785183911936n,
          "reimbursement": 0n,
          "round_id": 176146n,
          "transmitter": "0x1a4edc870eb8da3b73ab70d5dffc5c0a14a6ab1ad612845add04200582bffa4",
        },
        "data": [
          "0x2a5fa78",
          "0x678a24dd",
          "0x108060103050209000704000000000000000000000000000000000000000000",
          "0xa",
          "0x2a5580f",
          "0x2a5bf69",
          "0x2a5f992",
          "0x2a5f992",
          "0x2a5f992",
          "0x2a5fa78",
          "0x2a5fa78",
          "0x2a6096d",
          "0x2a6096d",
          "0x2a615fe",
          "0x0",
          "0x2d64b836639b",
          "0x40c03b6f80be73e1125f79855b79add29dbfc41d69bc79d8bb8b8e12dffc7",
          "0x1ee0005",
          "0x0",
        ],
        "eventIndex": 0,
        "eventIndexInTransaction": 0,
        "eventName": "chainlink::ocr2::aggregator::Aggregator::NewTransmission",
        "filterIds": [],
        "keys": [
          "0x19e22f866f4c5aead2809bf160d2b29e921e335d899979732101c6f3c38ff81",
          "0x2b012",
          "0x1a4edc870eb8da3b73ab70d5dffc5c0a14a6ab1ad612845add04200582bffa4",
        ],
        "transactionHash": "0x07021da0c8e9319d1144b0d56ed0bd86e46b15459cbb65c4dc0a05c8e274521d",
        "transactionIndex": 0,
        "transactionStatus": "succeeded",
      }
    `);
  });

  describe("Enum event decoding", () => {
    it("can decode RoleGranted (flat) event from enum", () => {
      const abi = golifeAbi;

      const roleGrantedEventSelector = getEventSelector("RoleGranted");

      const event = {
        transactionHash:
          "0x068b0a81f96d16e1b90d994d7e47e187770bcbc07257495e50fb3396712d9101",
        address:
          "0x00f92d3789e679e4ac8e94472ec6a67a63b99d042f772a0227b0d6bd241096c2",
        keys: [roleGrantedEventSelector],
        data: [
          "0x0", // Role Data
          "0x76e65f2bea9d559196eb91e967e8c4f43b4503198978bf672d10149b70cc1c6", // Account data
          "0x41a78e741e5af2fec34b695679bc6891742439f7afb8484ecd7766661ad02bf", // Sender data
        ],
        filterIds: [],
        eventIndex: 0,
        eventIndexInTransaction: 0,
        transactionIndex: 0,
        transactionStatus: "succeeded",
      } as const satisfies Event;

      const decoded = decodeEvent({
        abi,
        event,
        eventName: "gol_starknet::gol_lifeforms::GolLifeforms::Event",
        strict: false,
      });

      expect(decoded).toMatchInlineSnapshot(`
        {
          "address": "0x00f92d3789e679e4ac8e94472ec6a67a63b99d042f772a0227b0d6bd241096c2",
          "args": {
            "RoleGranted": {
              "account": "0x76e65f2bea9d559196eb91e967e8c4f43b4503198978bf672d10149b70cc1c6",
              "role": 0n,
              "sender": "0x41a78e741e5af2fec34b695679bc6891742439f7afb8484ecd7766661ad02bf",
            },
            "_tag": "RoleGranted",
          },
          "data": [
            "0x0",
            "0x76e65f2bea9d559196eb91e967e8c4f43b4503198978bf672d10149b70cc1c6",
            "0x41a78e741e5af2fec34b695679bc6891742439f7afb8484ecd7766661ad02bf",
          ],
          "eventIndex": 0,
          "eventIndexInTransaction": 0,
          "eventName": "gol_starknet::gol_lifeforms::GolLifeforms::Event",
          "filterIds": [],
          "keys": [
            "0x009d4a59b844ac9d98627ddba326ab3707a7d7e105fd03c777569d0f61a91f1e",
          ],
          "transactionHash": "0x068b0a81f96d16e1b90d994d7e47e187770bcbc07257495e50fb3396712d9101",
          "transactionIndex": 0,
          "transactionStatus": "succeeded",
        }
      `);
    });

    it("can decode Transfer (flat) event from enum", () => {
      const abi = golifeAbi;
      const transferEventSelector = getEventSelector("Transfer");
      const event = {
        transactionHash:
          "0x02e0abd9a260095622f71ff8869aaee0267af1199be78ad5ad91a3c83df0ad08",
        address:
          "0x00f92d3789e679e4ac8e94472ec6a67a63b99d042f772a0227b0d6bd241096c2",
        keys: [
          transferEventSelector,
          "0x0",
          "0x76e65f2bea9d559196eb91e967e8c4f43b4503198978bf672d10149b70cc1c6",
          "0xe000000",
          "0x0",
        ],
        data: [],
        filterIds: [],
        eventIndex: 0,
        eventIndexInTransaction: 0,
        transactionIndex: 0,
        transactionStatus: "succeeded",
      } as const satisfies Event;

      const decoded = decodeEvent({
        abi,
        event,
        eventName: "gol_starknet::gol_lifeforms::GolLifeforms::Event",
        strict: true,
      });

      expect(decoded).toMatchInlineSnapshot(`
        {
          "address": "0x00f92d3789e679e4ac8e94472ec6a67a63b99d042f772a0227b0d6bd241096c2",
          "args": {
            "Transfer": {
              "from": "0x0",
              "to": "0x76e65f2bea9d559196eb91e967e8c4f43b4503198978bf672d10149b70cc1c6",
              "token_id": 234881024n,
            },
            "_tag": "Transfer",
          },
          "data": [],
          "eventIndex": 0,
          "eventIndexInTransaction": 0,
          "eventName": "gol_starknet::gol_lifeforms::GolLifeforms::Event",
          "filterIds": [],
          "keys": [
            "0x0099cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9",
            "0x0",
            "0x76e65f2bea9d559196eb91e967e8c4f43b4503198978bf672d10149b70cc1c6",
            "0xe000000",
            "0x0",
          ],
          "transactionHash": "0x02e0abd9a260095622f71ff8869aaee0267af1199be78ad5ad91a3c83df0ad08",
          "transactionIndex": 0,
          "transactionStatus": "succeeded",
        }
      `);
    });

    it("can decode NewLifeForm (nested) event from enum", () => {
      const abi = golifeAbi;
      const newLifeFormEventSelector = getEventSelector("NewLifeForm");
      const event = {
        transactionHash:
          "0x02e0abd9a260095622f71ff8869aaee0267af1199be78ad5ad91a3c83df0ad08",
        address:
          "0x00f92d3789e679e4ac8e94472ec6a67a63b99d042f772a0227b0d6bd241096c2",
        keys: [newLifeFormEventSelector],
        data: [
          "0x76e65f2bea9d559196eb91e967e8c4f43b4503198978bf672d10149b70cc1c6",
          "0xe000000",
          "0x0",
          "0x1",
          "0x0",
          "0x1",
          "0x0",
          "0x2",
          "0xe000000",
          "0x0",
          "0x0",
        ],
        filterIds: [],
        eventIndex: 0,
        eventIndexInTransaction: 0,
        transactionIndex: 0,
        transactionStatus: "succeeded",
      } as const satisfies Event;

      const decoded = decodeEvent({
        abi,
        event,
        eventName: "gol_starknet::gol_lifeforms::GolLifeforms::Event",
        strict: true,
      });

      expect(decoded).toMatchInlineSnapshot(`
        {
          "address": "0x00f92d3789e679e4ac8e94472ec6a67a63b99d042f772a0227b0d6bd241096c2",
          "args": {
            "NewLifeForm": {
              "lifeform_data": {
                "age": 0n,
                "current_state": 234881024n,
                "is_alive": true,
                "is_dead": false,
                "is_loop": true,
                "is_still": false,
                "sequence_length": 2n,
              },
              "owner": "0x76e65f2bea9d559196eb91e967e8c4f43b4503198978bf672d10149b70cc1c6",
              "token_id": 234881024n,
            },
            "_tag": "NewLifeForm",
          },
          "data": [
            "0x76e65f2bea9d559196eb91e967e8c4f43b4503198978bf672d10149b70cc1c6",
            "0xe000000",
            "0x0",
            "0x1",
            "0x0",
            "0x1",
            "0x0",
            "0x2",
            "0xe000000",
            "0x0",
            "0x0",
          ],
          "eventIndex": 0,
          "eventIndexInTransaction": 0,
          "eventName": "gol_starknet::gol_lifeforms::GolLifeforms::Event",
          "filterIds": [],
          "keys": [
            "0x011f46882e19ad05d3762feda18b95af02b4d04ff264650de9665ede8f823262",
          ],
          "transactionHash": "0x02e0abd9a260095622f71ff8869aaee0267af1199be78ad5ad91a3c83df0ad08",
          "transactionIndex": 0,
          "transactionStatus": "succeeded",
        }
      `);
    });

    it("can decode PaymentReceived", () => {
      const abi = paymentAbi;
      const event = {
        transactionHash:
          "0x00c7b1db05a7d6e7edd6118f04de189db2353cb2484c6df7c191be1ef5af029c",
        address:
          "0x01f103e6694fcbdf2bfbe8db10d7b622bfab12da196ea1f212cb26367196af2c",
        keys: [
          "0x0040b634dd7cac6a7e5330478aa1704c7f20133def5f3fd107f3d185844a7b56",
        ],
        data: [
          "0x2137b4260e19ab8beac7bcd8b006186ff855a3b257df8ebad346978972567fb",
          "0x7d54bad6d6fcff799133a8c0b1fb8120876bb080d75cd601a5c68164d6f6d75",
          "0xc8",
          "0x0",
          "0x0",
          "0x7465737420726566",
          "0x8",
        ],
        filterIds: [],
        eventIndex: 0,
        eventIndexInTransaction: 0,
        transactionIndex: 0,
        transactionStatus: "succeeded",
      } as const satisfies Event;

      const decoded = decodeEvent({
        abi,
        event,
        eventName: "my_pay::contract::MyPay::Event",
        strict: true,
      });

      expect(decoded).toMatchInlineSnapshot(`
        {
          "address": "0x01f103e6694fcbdf2bfbe8db10d7b622bfab12da196ea1f212cb26367196af2c",
          "args": {
            "PaymentReceived": {
              "amount": 200n,
              "reference": "0x7465737420726566",
              "sender": "0x2137b4260e19ab8beac7bcd8b006186ff855a3b257df8ebad346978972567fb",
              "token": "0x7d54bad6d6fcff799133a8c0b1fb8120876bb080d75cd601a5c68164d6f6d75",
            },
            "_tag": "PaymentReceived",
          },
          "data": [
            "0x2137b4260e19ab8beac7bcd8b006186ff855a3b257df8ebad346978972567fb",
            "0x7d54bad6d6fcff799133a8c0b1fb8120876bb080d75cd601a5c68164d6f6d75",
            "0xc8",
            "0x0",
            "0x0",
            "0x7465737420726566",
            "0x8",
          ],
          "eventIndex": 0,
          "eventIndexInTransaction": 0,
          "eventName": "my_pay::contract::MyPay::Event",
          "filterIds": [],
          "keys": [
            "0x0040b634dd7cac6a7e5330478aa1704c7f20133def5f3fd107f3d185844a7b56",
          ],
          "transactionHash": "0x00c7b1db05a7d6e7edd6118f04de189db2353cb2484c6df7c191be1ef5af029c",
          "transactionIndex": 0,
          "transactionStatus": "succeeded",
        }
      `);
    });

    it("returns null when selector does not match in enum event", () => {
      const abi = golifeAbi;
      const transferEventSelector = getEventSelector("XXXX");
      const event = {
        transactionHash:
          "0x02e0abd9a260095622f71ff8869aaee0267af1199be78ad5ad91a3c83df0ad08",
        address:
          "0x00f92d3789e679e4ac8e94472ec6a67a63b99d042f772a0227b0d6bd241096c2",
        keys: [
          transferEventSelector,
          "0x0",
          "0x76e65f2bea9d559196eb91e967e8c4f43b4503198978bf672d10149b70cc1c6",
          "0xe000000",
          "0x0",
        ],
        data: [],
        filterIds: [],
        eventIndex: 0,
        eventIndexInTransaction: 0,
        transactionIndex: 0,
        transactionStatus: "succeeded",
      } as const satisfies Event;

      const decoded = decodeEvent({
        abi,
        event,
        eventName: "gol_starknet::gol_lifeforms::GolLifeforms::Event",
        strict: false,
      });

      expect(decoded).toBeNull();
    });

    it("returns null if parsing fails for enum event", () => {
      const abi = golifeAbi;

      const roleGrantedEventSelector = getEventSelector("RoleGranted");

      const event = {
        transactionHash:
          "0x068b0a81f96d16e1b90d994d7e47e187770bcbc07257495e50fb3396712d9101",
        address:
          "0x00f92d3789e679e4ac8e94472ec6a67a63b99d042f772a0227b0d6bd241096c2",
        keys: [roleGrantedEventSelector],
        data: [
          "0x0", // Role Data
          "0x76e65f2bea9d559196eb91e967e8c4f43b4503198978bf672d10149b70cc1c6",
          // Missing data
        ],
        filterIds: [],
        eventIndex: 0,
        eventIndexInTransaction: 0,
        transactionIndex: 0,
        transactionStatus: "succeeded",
      } as const satisfies Event;

      const decoded = decodeEvent({
        abi,
        event,
        eventName: "gol_starknet::gol_lifeforms::GolLifeforms::Event",
        strict: false,
      });

      expect(decoded).toBeNull();
    });

    it('can decode event with nested enum with null ["()" type] data', () => {
      const abi = registryAbi;
      const userRegisteredEventSelector = getEventSelector("UserRegistered");

      const event = {
        transactionHash:
          "0x07c2ea2b2211421e1a74e25f9fe9ad36862c83d6b7189b91185496c41cd83fc9",
        address:
          "0x04319b2cdf8f484e965a7df709e75c4d5c89780d3601f5105e1bc26243dd45b6",
        keys: [
          userRegisteredEventSelector,
          "0x348ed741a6cfdfa876b4bc233e8f769468a624ae66543d610235112943cc993",
          "0x796f64613133",
        ],
        data: ["0x6877a1fd", "0x1"],
        filterIds: [],
        eventIndex: 0,
        eventIndexInTransaction: 0,
        transactionIndex: 0,
        transactionStatus: "succeeded",
      } as const satisfies Event;

      const decoded = decodeEvent({
        abi,
        event,
        eventName:
          "opinion_competitions::utils::common::events::UserRegistered",
        strict: true,
      });

      expect(decoded).toMatchInlineSnapshot(`
        {
          "address": "0x04319b2cdf8f484e965a7df709e75c4d5c89780d3601f5105e1bc26243dd45b6",
          "args": {
            "timestamp": 1752670717n,
            "user": "0x348ed741a6cfdfa876b4bc233e8f769468a624ae66543d610235112943cc993",
            "username": 133519332421939n,
            "verification_level": {
              "ORB": null,
              "_tag": "ORB",
            },
          },
          "data": [
            "0x6877a1fd",
            "0x1",
          ],
          "eventIndex": 0,
          "eventIndexInTransaction": 0,
          "eventName": "opinion_competitions::utils::common::events::UserRegistered",
          "filterIds": [],
          "keys": [
            "0x015854d06e396351cf7ea2143ce9ba79f24588d0f1b1617f54e9acca7a6ac325",
            "0x348ed741a6cfdfa876b4bc233e8f769468a624ae66543d610235112943cc993",
            "0x796f64613133",
          ],
          "transactionHash": "0x07c2ea2b2211421e1a74e25f9fe9ad36862c83d6b7189b91185496c41cd83fc9",
          "transactionIndex": 0,
          "transactionStatus": "succeeded",
        }
      `);
    });
  });
});
