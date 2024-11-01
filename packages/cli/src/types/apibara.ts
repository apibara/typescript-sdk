import type { ConsolaInstance } from "consola";
import type { Hookable } from "hookable";
import type { ApibaraDynamicConfig, ApibaraOptions } from "./config";
import type { ApibaraHooks } from "./hooks";

export type IndexerDefinition = {
  // Name of the indexer.
  name: string;
  // Path to the indexer file.
  indexer: string;
};

export interface Apibara {
  options: ApibaraOptions;
  hooks: Hookable<ApibaraHooks>;
  indexers: IndexerDefinition[];
  logger: ConsolaInstance;
  close: () => Promise<void>;
  updateConfig: (config: ApibaraDynamicConfig) => void | Promise<void>;
}
