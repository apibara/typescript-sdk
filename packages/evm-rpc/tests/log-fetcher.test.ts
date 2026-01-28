import { http, createPublicClient } from "viem";
import { beforeAll, describe, expect, it } from "vitest";
import type { Log } from "../src/block";
import type { Filter } from "../src/filter";
import { fetchLogsByBlockHash, fetchLogsForRange } from "../src/log-fetcher";

const contract1 = "0xe0e0e08A6A4b9Dc7bD67BCB7aadE5cF48157d444" as const;
const contract2 = "0xA37cc341634AFD9E0919D334606E676dbAb63E17" as const;

describe("fetchLogsByBlockHash", () => {
  let client: ReturnType<typeof createPublicClient>;
  // block 24080094 on eth mainnet.
  const blockHash =
    "0xa513f32969106b29f6207bceb5f4ce4b3d1192571846b8a63f575762735a275c" as const;

  function sortResult({ logs }: { logs: Log[] }) {
    return {
      logs: [...logs].sort((a, b) => a.logIndex - b.logIndex),
    };
  }

  beforeAll(() => {
    const rpcUrl =
      process.env.TEST_EVM_RPC_URL ?? "https://ethereum-rpc.publicnode.com";
    client = createPublicClient({
      transport: http(rpcUrl),
    });
  });

  it("should return empty logs with empty filter", async () => {
    const filter: Filter = { logs: [] };
    const resultStandard = await fetchLogsByBlockHash({
      client,
      blockHash,
      filter,
      mergeGetLogs: false,
    });
    const resultMerged = await fetchLogsByBlockHash({
      client,
      blockHash,
      filter,
      mergeGetLogs: true,
    });

    const sortedStandard = sortResult(resultStandard);
    const sortedMerged = sortResult(resultMerged);

    expect(sortedMerged).toEqual(sortedStandard);
    expect(sortedMerged).toMatchSnapshot();
  });

  it("should return logs filtered by contract addresses", async () => {
    const filter: Filter = {
      logs: [
        { address: contract1, id: 1 },
        { address: contract2, id: 2 },
      ],
    };
    const resultStandard = await fetchLogsByBlockHash({
      client,
      blockHash,
      filter,
      mergeGetLogs: false,
    });
    const resultMerged = await fetchLogsByBlockHash({
      client,
      blockHash,
      filter,
      mergeGetLogs: true,
    });

    const sortedStandard = sortResult(resultStandard);
    const sortedMerged = sortResult(resultMerged);

    expect(sortedMerged).toEqual(sortedStandard);
    expect(sortedMerged).toMatchSnapshot();
  });

  it("should return logs filtered by contract address with strict empty topics and Transfer event", async () => {
    const filter: Filter = {
      logs: [
        { address: contract1, topics: [], strict: true, id: 1 },
        {
          address: contract1,
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          ],
          id: 2,
        },
        {
          address: contract2,
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          ],
          id: 3,
        },
      ],
    };
    const resultStandard = await fetchLogsByBlockHash({
      client,
      blockHash,
      filter,
      mergeGetLogs: false,
    });
    const resultMerged = await fetchLogsByBlockHash({
      client,
      blockHash,
      filter,
      mergeGetLogs: true,
    });

    const sortedStandard = sortResult(resultStandard);
    const sortedMerged = sortResult(resultMerged);

    expect(sortedMerged).toEqual(sortedStandard);
    expect(sortedMerged).toMatchSnapshot();
  });
});

describe("fetchLogsForRange", () => {
  let client: ReturnType<typeof createPublicClient>;
  const fromBlock = 24_080_080n;
  const toBlock = 24_080_100n;

  function sortResult({
    logs,
    blockNumbers,
  }: {
    logs: Record<number, Log[]>;
    blockNumbers: bigint[];
  }) {
    const sortedLogs: Record<number, Log[]> = {};
    const sortedBlockNumbers = [...blockNumbers].sort(
      (a, b) => Number(a) - Number(b),
    );

    for (const blockNumber of sortedBlockNumbers) {
      sortedLogs[Number(blockNumber)] = [...logs[Number(blockNumber)]].sort(
        (a, b) => a.logIndex - b.logIndex,
      );
    }

    return {
      logs: sortedLogs,
      blockNumbers: sortedBlockNumbers,
    };
  }

  beforeAll(() => {
    const rpcUrl =
      process.env.TEST_EVM_RPC_URL ?? "https://ethereum-rpc.publicnode.com";
    client = createPublicClient({
      transport: http(rpcUrl),
    });
  });

  it("should return empty logs with empty filter", async () => {
    const filter: Filter = { logs: [] };
    const resultStandard = await fetchLogsForRange({
      client,
      fromBlock,
      toBlock,
      filter,
      mergeGetLogs: false,
    });
    const resultMerged = await fetchLogsForRange({
      client,
      fromBlock,
      toBlock,
      filter,
      mergeGetLogs: true,
    });

    const sortedStandard = sortResult(resultStandard);
    const sortedMerged = sortResult(resultMerged);

    expect(sortedMerged).toEqual(sortedStandard);
    expect(sortedMerged).toMatchSnapshot();
  });

  it("should return logs filtered by contract addresses", async () => {
    const filter: Filter = {
      logs: [
        { address: contract1, id: 1 },
        { address: contract2, id: 2 },
      ],
    };
    const resultStandard = await fetchLogsForRange({
      client,
      fromBlock,
      toBlock,
      filter,
      mergeGetLogs: false,
    });
    const resultMerged = await fetchLogsForRange({
      client,
      fromBlock,
      toBlock,
      filter,
      mergeGetLogs: true,
    });

    const sortedStandard = sortResult(resultStandard);
    const sortedMerged = sortResult(resultMerged);

    expect(sortedMerged).toEqual(sortedStandard);
    expect(sortedMerged).toMatchSnapshot();
  });

  it("should return logs filtered by contract address with strict empty topics and Transfer event", async () => {
    const filter: Filter = {
      logs: [
        { address: contract1, topics: [], strict: true, id: 1 },
        {
          address: contract1,
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          ],
          id: 2,
        },
        {
          address: contract2,
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          ],
          id: 3,
        },
      ],
    };
    const resultStandard = await fetchLogsForRange({
      client,
      fromBlock,
      toBlock,
      filter,
      mergeGetLogs: false,
    });
    const resultMerged = await fetchLogsForRange({
      client,
      fromBlock,
      toBlock,
      filter,
      mergeGetLogs: true,
    });

    const sortedStandard = sortResult(resultStandard);
    const sortedMerged = sortResult(resultMerged);

    expect(sortedMerged).toEqual(sortedStandard);
    expect(sortedMerged).toMatchSnapshot();
  });
});
