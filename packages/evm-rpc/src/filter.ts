import type { LogFilter as DnaLogFilter, HeaderFilter } from "@apibara/evm";
import type { ValidateFilterResult } from "@apibara/protocol/rpc";
import { isHex } from "viem";

export type Filter = {
  header?: HeaderFilter;
  logs: LogFilter[];
};

export type LogFilter = Pick<
  DnaLogFilter,
  "address" | "topics" | "strict" | "id"
>;

export function validateFilter(filter: Filter): ValidateFilterResult {
  if (!filter.logs || filter.logs.length === 0) {
    return { valid: false, error: "Missing logs filter" };
  }

  let logFilterIndex = 0;
  for (const logFilter of filter.logs ?? []) {
    if (
      logFilter.address === undefined &&
      (logFilter.topics?.length ?? 0) === 0
    ) {
      return {
        valid: false,
        error: `Must provide at least one address or topic in log filter at position ${logFilterIndex}`,
      };
    }

    if (logFilter.address) {
      if (!isHex(logFilter.address)) {
        return {
          valid: false,
          error: "Invalid address format. Expected 0x-prefixed hex string",
        };
      }
    }

    if (logFilter.topics) {
      for (let i = 0; i < logFilter.topics.length; i++) {
        const topic = logFilter.topics[i];
        if (topic === null) {
          continue;
        }

        if (!isHex(topic)) {
          return {
            valid: false,
            error: `Invalid topic at index ${i}: ${topic}. Must be null or a 0x-prefixed hex string`,
          };
        }
      }
    }

    logFilterIndex++;
  }

  return { valid: true };
}
