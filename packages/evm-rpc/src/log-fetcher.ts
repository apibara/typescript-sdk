import type { LogFilter } from "@apibara/evm";
import type { Bytes } from "@apibara/protocol";
import type { RpcLog } from "viem";
import {
  hexToNumber,
  isAddressEqual,
  isHex,
  numberToHex,
  pad,
  trim,
} from "viem";
import type { Log } from "./block";
import type { Filter } from "./filter";
import { createTracer } from "./otel";
import type { ViemRpcClient } from "./stream-config";
import { viemRpcLogToDna } from "./transform";

const tracer = createTracer();

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
  return tracer.startActiveSpan("evm-rpc.fetchLogsForRange", async (span) => {
    try {
      span.setAttributes({
        fromBlock: fromBlock.toString(),
        toBlock: toBlock.toString(),
        mergeGetLogs,
        "filter.logs.length": filter.logs?.length ?? 0,
      });

      const logsByBlock: Record<number, Log[]> = {};

      if (!filter.logs || filter.logs.length === 0) {
        return { logs: logsByBlock, blockNumbers: [] };
      }

      const responses = mergeGetLogs
        ? await mergedGetLogsCalls({
            client,
            filter,
            fromBlock: numberToHex(fromBlock),
            toBlock: numberToHex(toBlock),
          })
        : await standardGetLogsCalls({
            client,
            filter,
            fromBlock: numberToHex(fromBlock),
            toBlock: numberToHex(toBlock),
          });

      const blockNumbers = new Set<bigint>();

      const seenLogsByBlockNumberAndIndex: Record<
        number,
        Record<number, number>
      > = {};

      for (const { logFilters, logs } of responses) {
        for (const log of logs) {
          if (log.blockNumber === null) {
            throw new Error("Log block number is null");
          }

          for (const logFilter of logFilters) {
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
                seenLogsByBlockNumberAndIndex[blockNumber][
                  refinedLog.logIndex
                ] = logsByBlock[blockNumber].length - 1;
              }
            }
          }
        }
      }

      const sortedBlockNumbers = Array.from(blockNumbers).sort((a, b) =>
        a < b ? -1 : a > b ? 1 : 0,
      );

      span.setAttributes({
        "result.blockCount": sortedBlockNumbers.length,
        "result.logCount": Object.values(logsByBlock).reduce(
          (sum, logs) => sum + logs.length,
          0,
        ),
      });

      return { logs: logsByBlock, blockNumbers: sortedBlockNumbers };
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

function refineLog(log: RpcLog, filter: LogFilter): Log | null {
  if (log.removed) {
    return null;
  }

  if (filter.address && !isAddressEqual(log.address, filter.address)) {
    return null;
  }

  const filterTopics = filter.topics ?? [];
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

async function mergedGetLogsCalls({
  client,
  filter,
  blockHash,
  fromBlock,
  toBlock,
}: {
  client: ViemRpcClient;
  filter: Filter;
  blockHash?: Bytes;
  fromBlock?: `0x${string}`;
  toBlock?: `0x${string}`;
}) {
  return tracer.startActiveSpan("evm-rpc.mergedGetLogsCalls", async (span) => {
    try {
      const blockParams = blockHash ? { blockHash } : { fromBlock, toBlock };

      const filtersWithAddress = filter.logs.filter(
        (f) => f.address !== undefined,
      );
      const filtersWithoutAddress = filter.logs.filter(
        (f) => f.address === undefined,
      );

      span.setAttributes({
        ...(fromBlock !== undefined && { fromBlock }),
        ...(toBlock !== undefined && { toBlock }),
        ...(blockHash !== undefined && { blockHash }),
        "filter.count": filter.logs.length,
        "filter.withAddress": filtersWithAddress.length,
        "filter.withoutAddress": filtersWithoutAddress.length,
      });

      const promises: Promise<{
        logs: RpcLog[];
        logFilters: typeof filter.logs;
      }>[] = [];

      if (filtersWithAddress.length > 0) {
        const addresses = filtersWithAddress.map((f) => f.address!);

        promises.push(
          client
            .request({
              method: "eth_getLogs",
              params: [
                {
                  address: addresses,
                  ...blockParams,
                },
              ],
            })
            .then((logs: RpcLog[]) => ({
              logs,
              logFilters: filtersWithAddress,
            })),
        );
      }

      if (filtersWithoutAddress.length > 0) {
        promises.push(
          client
            .request({
              method: "eth_getLogs",
              params: [
                {
                  ...blockParams,
                },
              ],
            })
            .then((logs: RpcLog[]) => ({
              logs,
              logFilters: filtersWithoutAddress,
            })),
        );
      }

      const result = await Promise.all(promises);

      const totalLogs = result.reduce((sum, r) => sum + r.logs.length, 0);
      span.setAttributes({
        "result.callCount": result.length,
        "result.logCount": totalLogs,
      });

      return result;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

async function standardGetLogsCalls({
  client,
  filter,
  blockHash,
  fromBlock,
  toBlock,
}: {
  client: ViemRpcClient;
  filter: Filter;
  blockHash?: Bytes;
  fromBlock?: `0x${string}`;
  toBlock?: `0x${string}`;
}) {
  return tracer.startActiveSpan(
    "evm-rpc.standardGetLogsCalls",
    async (span) => {
      try {
        const blockParams = blockHash ? { blockHash } : { fromBlock, toBlock };

        span.setAttributes({
          ...(fromBlock !== undefined && { fromBlock }),
          ...(toBlock !== undefined && { toBlock }),
          ...(blockHash !== undefined && { blockHash }),
          "filter.count": filter.logs.length,
        });

        const result = await Promise.all(
          filter.logs.map(async (logFilter) => {
            const logs = await client.request({
              method: "eth_getLogs",
              params: [
                {
                  address: logFilter.address,
                  topics:
                    logFilter.topics !== undefined
                      ? [...logFilter.topics]
                      : undefined,
                  ...blockParams,
                },
              ],
            });

            return { logs, logFilters: [logFilter] };
          }),
        );

        const totalLogs = result.reduce((sum, r) => sum + r.logs.length, 0);
        span.setAttributes({
          "result.callCount": result.length,
          "result.logCount": totalLogs,
        });

        return result;
      } catch (error) {
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    },
  );
}
