import { createLogger } from "apibara/runtime";
import type { LoggerFactoryFn, RegisterFn } from "apibara/types";
import { sdk } from "./otel/otel";

export const register: RegisterFn = async () => {
  sdk.start();
};

// You can create a logger with any configuration you want which returns a ConsolaReporter
export const logger: LoggerFactoryFn = ({ indexer, indexers, preset }) => {
  // Below logger is just a small customized example of the default logger used by apibara
  return createLogger({
    indexer: `cli-${indexer}`,
    indexers,
    preset,
  });
};
