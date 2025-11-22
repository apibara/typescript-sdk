import type { PublicClient, RpcLog } from "viem";
import { hexToNumber, numberToHex } from "viem";
import type { Log } from "./block";
import type { EvmRpcFilter, LogFilter } from "./filter";
import { viemRpcLogToDna } from "./transform";

export async function fetchLogsForBlock(
  client: PublicClient,
  blockNumber: bigint,
  filters: EvmRpcFilter[],
): Promise<Log[]> {
  const allLogs: Log[] = [];

  for (const filter of filters) {
    if (!filter.logs || filter.logs.length === 0) continue;

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

      for (const log of logs as RpcLog[]) {
        if (matchesLogFilter(log, logFilter)) {
          allLogs.push(viemRpcLogToDna(log));
        }
      }
    }
  }

  return allLogs;
}

export async function fetchLogsForRange(
  client: PublicClient,
  fromBlock: bigint,
  toBlock: bigint,
  filters: EvmRpcFilter[],
): Promise<Record<number, Log[]>> {
  const logsByBlock: Record<number, Log[]> = {};

  for (const filter of filters) {
    if (!filter.logs || filter.logs.length === 0) continue;

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

      for (const log of logs as RpcLog[]) {
        if (matchesLogFilter(log, logFilter)) {
          if (!log.blockNumber) continue;
          const blockNumber = hexToNumber(log.blockNumber);
          if (!logsByBlock[blockNumber]) {
            logsByBlock[blockNumber] = [];
          }
          logsByBlock[blockNumber].push(viemRpcLogToDna(log));
        }
      }
    }
  }

  return logsByBlock;
}

function matchesLogFilter(log: RpcLog, filter: LogFilter): boolean {
  if (!filter.topics || filter.topics.length === 0) {
    return true;
  }

  // Strict mode
  if (filter.strict && log.topics.length !== filter.topics.length) {
    return false;
  }

  if (log.topics.length < filter.topics.length) {
    return false;
  }

  for (let i = 0; i < filter.topics.length; i++) {
    const filterTopic = filter.topics[i];
    const logTopic = log.topics[i];

    if (filterTopic === null) continue;

    if (!logTopic) return false;

    if (filterTopic !== logTopic) return false;
  }

  return true;
}
