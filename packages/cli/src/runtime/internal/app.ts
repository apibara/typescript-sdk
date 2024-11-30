import { createIndexer as _createIndexer } from "@apibara/indexer";
import { type ConsolaReporter, logger } from "@apibara/indexer/plugins/logger";
import { inMemoryPersistence } from "@apibara/indexer/plugins/persistence";

import { config } from "#apibara-internal-virtual/config";
import { indexers } from "#apibara-internal-virtual/indexers";

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

  const definition =
    typeof indexerDefinition.indexer === "function"
      ? indexerDefinition.indexer(runtimeConfig)
      : indexerDefinition.indexer;

  let reporter: ConsolaReporter = createLogger({
    indexer: indexerName,
    preset,
    indexers: availableIndexers,
  });

  if (config.logger) {
    reporter = config.logger({
      indexer: indexerName,
      preset,
      indexers: availableIndexers,
    });
  }

  // Put the in-memory persistence plugin first so that it can be overridden by any user-defined
  // persistence plugin.
  // Put the logger last since we want to override any user-defined logger.
  definition.plugins = [
    inMemoryPersistence(),
    ...(definition.plugins ?? []),
    logger({ logger: reporter }),
  ];

  return _createIndexer(definition);
}
