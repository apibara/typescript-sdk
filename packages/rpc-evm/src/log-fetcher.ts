import type { PublicClient, RpcLog } from "viem";
import { hexToNumber, isHex, numberToHex, pad, trim } from "viem";
import type { Log } from "./block";
import type { EvmRpcFilter, LogFilter } from "./filter";
import { viemRpcLogToDna } from "./transform";

export async function fetchLogsForBlock(
  client: PublicClient,
  blockNumber: bigint,
  filter: EvmRpcFilter,
): Promise<Log[]> {
  const allLogs: Log[] = [];

  if (!filter.logs || filter.logs.length === 0) {
    return allLogs;
  }

  for (const logFilter of filter.logs) {
    // NOTE: we do manual request instead of getLogs method to handle topics properly as per our DNA based filters
    const logs = await client.request({
      method: "eth_getLogs",
      params: [
        {
          fromBlock: numberToHex(blockNumber),
          toBlock: numberToHex(blockNumber),
          address: logFilter.address,
          topics: logFilter.topics ? [...logFilter.topics] : undefined,
        },
      ],
    });

    if (!Array.isArray(logs)) {
      throw new Error(
        `Expected array of logs but got ${typeof logs}: ${JSON.stringify(logs)}`,
      );
    }

    for (const log of logs) {
      const refinedLog = refineLog(log, logFilter);
      if (refinedLog) {
        allLogs.push(refinedLog);
      }
    }
  }

  return allLogs;
}

export async function fetchLogsForRange(
  client: PublicClient,
  fromBlock: bigint,
  toBlock: bigint,
  filter: EvmRpcFilter,
): Promise<Record<number, Log[]>> {
  const logsByBlock: Record<number, Log[]> = {};

  if (!filter.logs || filter.logs.length === 0) {
    return logsByBlock;
  }

  for (const logFilter of filter.logs) {
    const logs = await client.request({
      method: "eth_getLogs",
      params: [
        {
          fromBlock: numberToHex(fromBlock),
          toBlock: numberToHex(toBlock),
          address: logFilter.address,
          topics: logFilter.topics ? [...logFilter.topics] : undefined,
        },
      ],
    });

    if (!Array.isArray(logs)) {
      throw new Error(
        `Expected array of logs but got ${typeof logs}: ${JSON.stringify(logs)}`,
      );
    }

    for (const log of logs) {
      if (!log.blockNumber) continue;

      const refinedLog = refineLog(log, logFilter);
      if (refinedLog) {
        const blockNumber = hexToNumber(log.blockNumber);
        if (!logsByBlock[blockNumber]) {
          logsByBlock[blockNumber] = [];
        }
        logsByBlock[blockNumber].push(refinedLog);
      }
    }
  }

  return logsByBlock;
}

function refineLog(log: RpcLog, filter: LogFilter): Log | null {
  if (!filter.topics || filter.topics.length === 0) {
    return viemRpcLogToDna(log);
  }

  // Strict mode
  if (filter.strict && log.topics.length !== filter.topics.length) {
    return null;
  }

  if (log.topics.length < filter.topics.length) {
    return null;
  }

  for (let i = 0; i < filter.topics.length; i++) {
    const filterTopic = filter.topics[i];
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
