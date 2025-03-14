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

  const reporter: ConsolaReporter = createLogger({
    indexer: indexerName,
    preset,
    indexers: availableIndexers,
  });

  // TODO: Add support for custom logger
  //
  // Custom logger support is temporarily disabled to prevent bundling issues.
  // Previously, when using the config object directly, Rollup would bundle everything
  // referenced in apibara.config, including plugins. Now we serialize only the
  // essential config properties (runtimeConfig, preset, presets) during build time,
  // which prevents unwanted bundling but also means we can't access the logger
  // configuration.
  //
  // if (config.logger) {
  //   reporter = config.logger({
  //     indexer: indexerName,
  //     preset,
  //     indexers: availableIndexers,
  //   });
  // }

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
