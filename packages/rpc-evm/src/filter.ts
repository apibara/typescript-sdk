import type { LogFilter as DnaLogFilter, HeaderFilter } from "@apibara/evm";

export type EvmRpcFilter = {
  header?: HeaderFilter;
  logs?: LogFilter[];
};

export type LogFilter = Pick<DnaLogFilter, "address" | "topics" | "strict">;

export function validateEvmRpcFilter(filter: EvmRpcFilter): void {
  if (filter.logs && filter.logs.length > 0) {
    for (const logFilter of filter.logs) {
      if (logFilter.address) {
        const addresses = Array.isArray(logFilter.address)
          ? logFilter.address
          : [logFilter.address];

        for (const addr of addresses) {
          if (!addr.startsWith("0x")) {
            throw new Error(
              `Invalid address format: ${addr}. Must be a 0x-prefixed hex string`,
            );
          }
        }
      }

      if (logFilter.topics) {
        for (let i = 0; i < logFilter.topics.length; i++) {
          const topic = logFilter.topics[i];
          if (topic !== null && !topic.startsWith("0x")) {
            throw new Error(
              `Invalid topic at index ${i}: ${topic}. Must be null or a 0x-prefixed hex string`,
            );
          }
        }
      }

      if (
        logFilter.strict !== undefined &&
        typeof logFilter.strict !== "boolean"
      ) {
        throw new Error(
          `Invalid strict value: ${logFilter.strict}. Must be a boolean`,
        );
      }
    }
  }
}
