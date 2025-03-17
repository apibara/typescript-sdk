import { createIndexer as _createIndexer } from "@apibara/indexer";
import {
  type InternalContext,
  internalContext,
} from "@apibara/indexer/internal/plugins";
import {
  type ConsolaReporter,
  inMemoryPersistence,
  logger,
} from "@apibara/indexer/plugins";
import consola from "consola";
import { config } from "#apibara-internal-virtual/config";
import { indexers } from "#apibara-internal-virtual/indexers";
import { logger as instrumentationLogger } from "#apibara-internal-virtual/instrumentation";
import { createLogger } from "./logger";

export const availableIndexers = indexers.map((i) => i.name);

export function createIndexer(indexerName: string, preset?: string) {
  let runtimeConfig: Record<string, unknown> = { ...config.runtimeConfig };

  if (preset) {
    if (config.presets === undefined) {
      throw new Error(
        `Specified preset "${preset}" but no presets were defined`,
      );
    }

    if (config.presets[preset] === undefined) {
      throw new Error(`Specified preset "${preset}" but it was not defined`);
    }

    const presetValue = config.presets[preset] as {
      runtimeConfig: Record<string, unknown>;
    };
    runtimeConfig = { ...runtimeConfig, ...presetValue.runtimeConfig };
  }

  const indexerDefinition = indexers.find((i) => i.name === indexerName);

  if (indexerDefinition === undefined) {
    throw new Error(
      `Specified indexer "${indexerName}" but it was not defined`,
    );
  }

  const indexerModule = indexerDefinition.indexer?.default;
  if (indexerModule === undefined) {
    consola.warn(
      `Specified indexer "${indexerName}" but it does not export a default. Ignoring.`,
    );
    return;
  }

  const definition =
    typeof indexerModule === "function"
      ? indexerModule(runtimeConfig)
      : indexerModule;

  let reporter: ConsolaReporter = createLogger({
    indexer: indexerName,
    preset,
    indexers: availableIndexers,
  });

  // Check if a custom logger is provided through instrumentation
  if (instrumentationLogger) {
    // Create a reporter using the custom logger function
    const _reporter = instrumentationLogger({
      indexer: indexerName,
      preset,
      indexers: availableIndexers,
    });

    // If the reporter is valid (has a log method), use it instead of the default
    if (_reporter && "log" in _reporter) {
      reporter = _reporter;
    }
  }

  // Put the in-memory persistence plugin first so that it can be overridden by any user-defined
  // persistence plugin.
  definition.plugins = [
    internalContext({
      indexerName,
      availableIndexers,
    } as InternalContext),
    logger({ logger: reporter }),
    inMemoryPersistence(),
    ...(definition.plugins ?? []),
  ];

  return _createIndexer(definition);
}
