import { createIndexer as _createIndexer } from "@apibara/indexer";

import { config } from "#apibara-internal-virtual/config";
import { indexers } from "#apibara-internal-virtual/indexers";

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

  return typeof indexerDefinition.indexer === "function"
    ? _createIndexer(indexerDefinition.indexer(runtimeConfig))
    : _createIndexer(indexerDefinition.indexer);
}
