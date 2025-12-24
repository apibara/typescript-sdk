import type { LogFilter } from "@apibara/evm";
import type { Bytes } from "@apibara/protocol";
import type { RpcLog } from "viem";
import { hexToNumber, isHex, numberToHex, pad, trim } from "viem";
import type { Log } from "./block";
import type { Filter } from "./filter";
import type { ViemRpcClient } from "./stream-config";
import { viemRpcLogToDna } from "./transform";

export async function fetchLogsByBlockHash({
  client,
  blockHash,
  filter,
  mergeGetLogs,
}: {
  client: ViemRpcClient;
  blockHash: Bytes;
  filter: Filter;
  mergeGetLogs: boolean;
}): Promise<{ logs: Log[] }> {
  if (!filter.logs || filter.logs.length === 0) {
    return { logs: [] };
  }

  const responses = await Promise.all(
    filter.logs.map(async (logFilter) => {
      const logs = await client.request({
        method: "eth_getLogs",
        params: [
          {
            blockHash,
            address: logFilter.address,
            topics: logFilter.topics ? [...logFilter.topics] : undefined,
          },
        ],
      });
      return { logs, logFilter };
    }),
  );

  // Multiple calls may have produced the same log.
  // We track all the logs (by their logIndex, which is unique within a block).
  // logIndex -> position
  const allLogs: Log[] = [];
  const seenLogsByIndex: Record<number, number> = {};

  for (const { logFilter, logs } of responses) {
    for (const log of logs) {
      if (log.blockNumber === null) {
        throw new Error("Log block number is null");
      }

      const refinedLog = refineLog(log, logFilter);

      if (refinedLog) {
        const existingPosition = seenLogsByIndex[refinedLog.logIndex];

        if (existingPosition !== undefined) {
          const existingLog = allLogs[existingPosition];
          (existingLog.filterIds as number[]).push(logFilter.id ?? 0);
        } else {
          (refinedLog.filterIds as number[]).push(logFilter.id ?? 0);

          allLogs.push(refinedLog);
          seenLogsByIndex[refinedLog.logIndex] = allLogs.length - 1;
        }
      }
    }
  }

  return { logs: allLogs };
}

export async function fetchLogsForRange({
  client,
  fromBlock,
  toBlock,
  filter,
  mergeGetLogs,
}: {
  client: ViemRpcClient;
  fromBlock: bigint;
  toBlock: bigint;
  filter: Filter;
  mergeGetLogs: boolean;
}): Promise<{ logs: Record<number, Log[]>; blockNumbers: bigint[] }> {
  const logsByBlock: Record<number, Log[]> = {};

  if (!filter.logs || filter.logs.length === 0) {
    return { logs: logsByBlock, blockNumbers: [] };
  }

  const responses = await Promise.all(
    filter.logs.map(async (logFilter) => {
      const logs = await client.request({
        method: "eth_getLogs",
        params: [
          {
            fromBlock: numberToHex(fromBlock),
            toBlock: numberToHex(toBlock),
            address: logFilter.address,
            topics:
              logFilter.topics !== undefined
                ? [...logFilter.topics]
                : undefined,
          },
        ],
      });
      return { logs, logFilter };
    }),
  );

  const blockNumbers = new Set<bigint>();

  // Multiple calls may have produced the same log.
  // We track all the logs (by their logIndex, which is unique within a block).
  // blockNumber -> logIndex -> position
  const seenLogsByBlockNumberAndIndex: Record<
    number,
    Record<number, number>
  > = {};

  for (const { logFilter, logs } of responses) {
    for (const log of logs) {
      if (log.blockNumber === null) {
        throw new Error("Log block number is null");
      }

      const refinedLog = refineLog(log, logFilter);

      if (refinedLog) {
        const blockNumber = hexToNumber(log.blockNumber);
        blockNumbers.add(BigInt(blockNumber));

        if (!logsByBlock[blockNumber]) {
          logsByBlock[blockNumber] = [];
        }

        if (!seenLogsByBlockNumberAndIndex[blockNumber]) {
          seenLogsByBlockNumberAndIndex[blockNumber] = {};
        }

        const existingPosition =
          seenLogsByBlockNumberAndIndex[blockNumber][refinedLog.logIndex];

        if (existingPosition !== undefined) {
          const existingLog = logsByBlock[blockNumber][existingPosition];
          (existingLog.filterIds as number[]).push(logFilter.id ?? 0);
        } else {
          (refinedLog.filterIds as number[]).push(logFilter.id ?? 0);

          logsByBlock[blockNumber].push(refinedLog);
          seenLogsByBlockNumberAndIndex[blockNumber][refinedLog.logIndex] =
            logsByBlock[blockNumber].length - 1;
        }
      }
    }
  }

  const sortedBlockNumbers = Array.from(blockNumbers).sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  );

  return { logs: logsByBlock, blockNumbers: sortedBlockNumbers };
}

function refineLog(log: RpcLog, filter: LogFilter): Log | null {
  if (log.removed) {
    return null;
  }

  const filterTopics = filter.topics ?? [];
  // Strict mode
  if (filter.strict && log.topics.length !== filterTopics.length) {
    return null;
  }

  if (filterTopics.length === 0) {
    return viemRpcLogToDna(log);
  }

  if (log.topics.length < filterTopics.length) {
    return null;
  }

  for (let i = 0; i < filterTopics.length; i++) {
    const filterTopic = filterTopics[i];
    const logTopic = log.topics[i];

    if (filterTopic === null) continue;

    if (!logTopic) return null;

    if (!isHex(filterTopic) || !isHex(logTopic)) {
      return null;
    }

    const normalizedFilter = pad(trim(filterTopic), { size: 32 });
    const normalizedLog = pad(trim(logTopic), { size: 32 });

    if (normalizedFilter !== normalizedLog) {
      return null;
    }
  }

  return viemRpcLogToDna(log);
}

function standardGetLogsCalls({
  filter,
  blockHash,
  fromBlock,
  toBlock,
}: {
  filter: Filter;
  blockHash?: Bytes;
  fromBlock?: `0x${string}`;
  toBlock?: `0x${string}`;
}) {
  return filter.logs.map((logFilter) => ({
    params: [
      {
        blockHash,
        fromBlock,
        toBlock,
        address: logFilter.address,
        topics: logFilter.topics ? [...logFilter.topics] : undefined,
      },
    ],
  }));
}
