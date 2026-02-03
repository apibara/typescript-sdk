import type { FetchBlockRangeResult } from "@apibara/protocol/rpc";
import { http, createPublicClient } from "viem";
import { beforeAll, describe, expect, it } from "vitest";
import type { Block } from "../src/block";
import type { Filter } from "../src/filter";
import { EvmRpcStream } from "../src/stream-config";

const fallbackRpcUrls = [
  "https://sepolia.gateway.tenderly.co",
  "https://sepolia.drpc.org",
];

const rpcUrl = process.env.TEST_EVM_SEPOLIA_RPC_URL ?? fallbackRpcUrls[0];

const filter: Filter = {
  logs: [
    {
      id: 1,
      address: "0xe0e0e08A6A4b9Dc7bD67BCB7aadE5cF48157d444",
      topics: [],
      strict: true,
    },
    {
      id: 2,
      address: "0xe0e0e08A6A4b9Dc7bD67BCB7aadE5cF48157d444",
      topics: [
        "0x5e4688b340694b7c7fd30047fd082117dc46e32acfbf81a44bb1fac0ae65154d",
      ],
      strict: false,
    },
    {
      id: 3,
      address: "0xe0e0e08A6A4b9Dc7bD67BCB7aadE5cF48157d444",
      topics: [
        "0xa2d4008be4187c63684f323788e131e1370dbc2205499befe2834005a00c792c",
      ],
      strict: false,
    },
    {
      id: 4,
      address: "0xe0e0e08A6A4b9Dc7bD67BCB7aadE5cF48157d444",
      topics: [
        "0xbb3992d83c721f12a8f32242e0d21c3613949c6a69d2a35deecdf6943a61c8b2",
      ],
      strict: false,
    },
    {
      id: 5,
      address: "0xe0e0e08A6A4b9Dc7bD67BCB7aadE5cF48157d444",
      topics: [
        "0x8fc241308ffc17817e6a8c6a52a8f7cd4931dfca0c539fd35a630311c7e4c57b",
      ],
      strict: false,
    },
    {
      id: 6,
      address: "0xe0e0e08A6A4b9Dc7bD67BCB7aadE5cF48157d444",
      topics: [
        "0xf7e050d866774820d81a86ca676f3afe7bc72603ee893f82e99c08fbde39af6c",
      ],
      strict: false,
    },
    {
      id: 7,
      address: "0xe0e0e08A6A4b9Dc7bD67BCB7aadE5cF48157d444",
      topics: [
        "0xec1256266e470abb868620c851f6bde2a3ff602549dcad318ab9ccfcb2977f14",
      ],
      strict: false,
    },
    {
      id: 8,
      address: "0xA37cc341634AFD9E0919D334606E676dbAb63E17",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      ],
      strict: false,
    },
    {
      id: 9,
      address: "0x51d02A5948496a67827242EaBc5725531342527C",
      topics: [],
      strict: true,
    },
    {
      id: 10,
      address: "0xd4279c050da1f5c5b2830558c7a08e57e12b54ec",
      topics: [],
      strict: true,
    },
    {
      id: 11,
      address: "0xd4279c050da1f5c5b2830558c7a08e57e12b54ec",
      topics: [
        "0x7c8a7287149dd38ccf269c60c4074a91adb99a9df90bff524e1f75d3e99e1b0b",
      ],
      strict: false,
    },
    {
      id: 12,
      address: "0xd4279c050da1f5c5b2830558c7a08e57e12b54ec",
      topics: [
        "0x7fce005f86d524b780c41f8bf45b002bef31a9d576e64498b27aedef4ff7220a",
      ],
      strict: false,
    },
    {
      id: 13,
      address: "0xae1430e3e089794beacba260657fcd0f0967c18a",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      ],
      strict: false,
    },
    {
      id: 14,
      address: "0xBe4C4C4e35DED081831A1f04e24E84dEFbA75fEC",
      topics: [
        "0x15cbc3785d6c225df42bdfaec854f81d0afcccdcefaeabef19179ed59d52f3d5",
      ],
      strict: false,
    },
    {
      id: 15,
      address: "0xBe4C4C4e35DED081831A1f04e24E84dEFbA75fEC",
      topics: [
        "0xd6206cb67c5fd50198d5d210338167aed7b5ec0c9ada8ca37adb3f74ea03395d",
      ],
      strict: false,
    },
    {
      id: 16,
      address: "0x2b8d80d891C1E20aca70fF8a85714aa1900Ab120",
      topics: [
        "0xd156160e7e47c8bdc4102917387c735d32cac065a445a0389a8952835f77478c",
      ],
      strict: false,
    },
    {
      id: 17,
      address: "0x00000000000014aA86C5d3c41765bb24e11bd701",
      topics: [],
      strict: true,
    },
    {
      id: 18,
      address: "0x00000000000014aA86C5d3c41765bb24e11bd701",
      topics: [
        "0x5e4688b340694b7c7fd30047fd082117dc46e32acfbf81a44bb1fac0ae65154d",
      ],
      strict: false,
    },
    {
      id: 19,
      address: "0x00000000000014aA86C5d3c41765bb24e11bd701",
      topics: [
        "0x704b3ab4a76158ad4d66625a2a43be81edbffd24630e8fde5174e97035370a07",
      ],
      strict: false,
    },
    {
      id: 20,
      address: "0x00000000000014aA86C5d3c41765bb24e11bd701",
      topics: [
        "0xd76ec32fbc3f07c70828b4f94343ee73279d0e8d4d2f28b018a4e67f37497753",
      ],
      strict: false,
    },
    {
      id: 21,
      address: "0x00000000000014aA86C5d3c41765bb24e11bd701",
      topics: [
        "0xf7e050d866774820d81a86ca676f3afe7bc72603ee893f82e99c08fbde39af6c",
      ],
      strict: false,
    },
    {
      id: 22,
      address: "0x00000000000014aA86C5d3c41765bb24e11bd701",
      topics: [
        "0xec1256266e470abb868620c851f6bde2a3ff602549dcad318ab9ccfcb2977f14",
      ],
      strict: false,
    },
    {
      id: 23,
      address: "0x517E506700271AEa091b02f42756F5E174Af5230",
      topics: [],
      strict: true,
    },
    {
      id: 24,
      address: "0xd4F1060cB9c1A13e1d2d20379b8aa2cF7541eD9b",
      topics: [],
      strict: true,
    },
    {
      id: 25,
      address: "0xd4F1060cB9c1A13e1d2d20379b8aa2cF7541eD9b",
      topics: [
        "0x8c8c473f31171bbd0f7702c5c4b1f7167c5f452722221d077b38fcf066624083",
      ],
      strict: false,
    },
    {
      id: 26,
      address: "0xd4F1060cB9c1A13e1d2d20379b8aa2cF7541eD9b",
      topics: [
        "0x31d26f11bb53cdacb84bf1c4daef5696f62c14d2eb3e05ec5679d62b24097b8e",
      ],
      strict: false,
    },
    {
      id: 27,
      address: "0xfF6cF0Ca6d7a30a60539AcD4bB20B3df84EA0644",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      ],
      strict: false,
    },
    {
      id: 28,
      address: "0xC52D2656cb8C634263E6A15469588beB9C3Bb738",
      topics: [
        "0x15cbc3785d6c225df42bdfaec854f81d0afcccdcefaeabef19179ed59d52f3d5",
      ],
      strict: false,
    },
    {
      id: 29,
      address: "0xC52D2656cb8C634263E6A15469588beB9C3Bb738",
      topics: [
        "0xd6206cb67c5fd50198d5d210338167aed7b5ec0c9ada8ca37adb3f74ea03395d",
      ],
      strict: false,
    },
    {
      id: 30,
      address: "0xAA166592922C4020cEfA23448054AD070211790a",
      topics: [
        "0xd156160e7e47c8bdc4102917387c735d32cac065a445a0389a8952835f77478c",
      ],
      strict: false,
    },
    {
      id: 31,
      address: "0xd4B54d0ca6979Da05F25895E6e269E678ba00f9e",
      topics: [],
      strict: true,
    },
    {
      id: 32,
      address: "0xd4B54d0ca6979Da05F25895E6e269E678ba00f9e",
      topics: [
        "0x2e7673084df1be3c83415d000644819451eb77966bda2a98c67d31dee56ebe66",
      ],
      strict: false,
    },
    {
      id: 33,
      address: "0x948b9C2C99718034954110cB61a6e08e107745f9",
      topics: [],
      strict: true,
    },
    {
      id: 34,
      address: "0x948b9C2C99718034954110cB61a6e08e107745f9",
      topics: [
        "0x2e7673084df1be3c83415d000644819451eb77966bda2a98c67d31dee56ebe66",
      ],
      strict: false,
    },
    {
      id: 35,
      address: "0x02D9876A21AF7545f8632C3af76eC90b5ad4b66D",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      ],
      strict: false,
    },
  ],
};

const startBlock = 10_140_600n;
const endBlock = 10_140_800n;

function normalizeResult(result: FetchBlockRangeResult<Block>) {
  const data = [...result.data]
    .map((entry) => {
      const block = entry.block
        ? {
            header: entry.block.header,
            logs: [...entry.block.logs]
              .map((log) => ({
                ...log,
                filterIds: [...log.filterIds].sort((a, b) => a - b),
              }))
              .sort((a, b) => a.logIndex - b.logIndex),
          }
        : null;

      return {
        cursor: entry.cursor,
        endCursor: entry.endCursor,
        block,
      };
    })
    .sort((a, b) => {
      const aKey = a.block?.header.blockNumber ?? a.endCursor.orderKey;
      const bKey = b.block?.header.blockNumber ?? b.endCursor.orderKey;
      return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
    });

  return {
    startBlock: result.startBlock,
    endBlock: result.endBlock,
    data,
  };
}

describe("EvmRpcStream", () => {
  let client: ReturnType<typeof createPublicClient>;

  beforeAll(() => {
    client = createPublicClient({
      transport: http(rpcUrl),
    });
  });

  it("returns identical logs for merged and standard getLogs", async () => {
    const mergedStream = new EvmRpcStream(client, {
      mergeGetLogsFilter: "always",
      getLogsRangeSize: 10_000n,
    });

    const standardStream = new EvmRpcStream(client, {
      mergeGetLogsFilter: false,
      getLogsRangeSize: 10_000n,
    });

    const merged = await mergedStream.fetchBlockRange({
      startBlock,
      maxBlock: endBlock,
      force: true,
      filter,
    });

    const standard = await standardStream.fetchBlockRange({
      startBlock,
      maxBlock: endBlock,
      force: true,
      filter,
    });

    expect(normalizeResult(merged)).toEqual(normalizeResult(standard));
  }, 60_000);
});
