import { http, createPublicClient } from "viem";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Log } from "../src/block";
import type { Filter } from "../src/filter";
import { fetchLogsForRange } from "../src/log-fetcher";
import { getFinishedSpans, resetSpans, setupTestTracer } from "./otel-helper";

const contract1 = "0xe0e0e08A6A4b9Dc7bD67BCB7aadE5cF48157d444" as const;
const contract2 = "0xA37cc341634AFD9E0919D334606E676dbAb63E17" as const;

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
    setupTestTracer();

    const rpcUrl =
      process.env.TEST_EVM_RPC_URL ?? "https://ethereum-rpc.publicnode.com";
    client = createPublicClient({
      transport: http(rpcUrl),
    });
  });

  beforeEach(() => {
    resetSpans();
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

    // Empty filter returns early so only the outer span is emitted.
    const spans = getFinishedSpans();
    expect(spans.map((s) => s.name)).toEqual([
      "evm-rpc.fetchLogsForRange",
      "evm-rpc.fetchLogsForRange",
    ]);
    for (const span of spans) {
      expect(span.attributes).toMatchObject({
        fromBlock: fromBlock.toString(),
        toBlock: toBlock.toString(),
        mergeGetLogs: span.attributes.mergeGetLogs as boolean,
        "filter.logs.length": 0,
      });
    }
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

    const spans = getFinishedSpans();
    const standardFetch = spans.find(
      (s) =>
        s.name === "evm-rpc.fetchLogsForRange" && !s.attributes.mergeGetLogs,
    );
    const mergedFetch = spans.find(
      (s) =>
        s.name === "evm-rpc.fetchLogsForRange" && s.attributes.mergeGetLogs,
    );

    expect(standardFetch).toBeDefined();
    expect(standardFetch!.attributes).toMatchObject({
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
      mergeGetLogs: false,
      "filter.logs.length": 2,
      "result.blockCount": expect.any(Number),
      "result.logCount": expect.any(Number),
    });

    expect(mergedFetch).toBeDefined();
    expect(mergedFetch!.attributes).toMatchObject({
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
      mergeGetLogs: true,
      "filter.logs.length": 2,
      "result.blockCount": expect.any(Number),
      "result.logCount": expect.any(Number),
    });

    // Nested helpers should also have emitted spans.
    expect(spans.some((s) => s.name === "evm-rpc.standardGetLogsCalls")).toBe(
      true,
    );
    expect(spans.some((s) => s.name === "evm-rpc.mergedGetLogsCalls")).toBe(
      true,
    );
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

    const spans = getFinishedSpans();
    const standardFetch = spans.find(
      (s) =>
        s.name === "evm-rpc.fetchLogsForRange" && !s.attributes.mergeGetLogs,
    );
    const mergedFetch = spans.find(
      (s) =>
        s.name === "evm-rpc.fetchLogsForRange" && s.attributes.mergeGetLogs,
    );

    expect(standardFetch).toBeDefined();
    expect(standardFetch!.attributes).toMatchObject({
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
      mergeGetLogs: false,
      "filter.logs.length": 3,
      "result.blockCount": expect.any(Number),
      "result.logCount": expect.any(Number),
    });

    expect(mergedFetch).toBeDefined();
    expect(mergedFetch!.attributes).toMatchObject({
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
      mergeGetLogs: true,
      "filter.logs.length": 3,
      "result.blockCount": expect.any(Number),
      "result.logCount": expect.any(Number),
    });

    expect(spans.some((s) => s.name === "evm-rpc.standardGetLogsCalls")).toBe(
      true,
    );
    expect(spans.some((s) => s.name === "evm-rpc.mergedGetLogsCalls")).toBe(
      true,
    );
  });
});
