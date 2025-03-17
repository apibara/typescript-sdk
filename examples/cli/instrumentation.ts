import { createLogger } from "apibara/runtime";
import type { LoggerFactoryFn, RegisterFn } from "apibara/types";

export const register: RegisterFn = async () => {
  // You can register any side effects such as Opentelemetry, Sentry etc.
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
