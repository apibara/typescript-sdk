import { describe, expect, it } from "vitest";

import type { Event } from "../src/block";
import { decodeEvent } from "../src/event";

import { chainlinkAbi } from "./fixtures/chainlink-abi";
import { ekuboAbi } from "./fixtures/ekubo-abi";

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
        "eventName": "ekubo::core::Core::PositionUpdated",
        "keys": [
          "0x3a7adca3546c213ce791fabf3b04090c163e419c808c9830fb343a4a395946e",
        ],
        "transactionHash": "0x008691c1fa0f5c650b3492396dc1c22423c04e9a8843a12eaab03799d0a45cd0",
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
        "eventName": "chainlink::ocr2::aggregator::Aggregator::NewTransmission",
        "keys": [
          "0x19e22f866f4c5aead2809bf160d2b29e921e335d899979732101c6f3c38ff81",
          "0x2b012",
          "0x1a4edc870eb8da3b73ab70d5dffc5c0a14a6ab1ad612845add04200582bffa4",
        ],
        "transactionHash": "0x07021da0c8e9319d1144b0d56ed0bd86e46b15459cbb65c4dc0a05c8e274521d",
      }
    `);
  });
});
