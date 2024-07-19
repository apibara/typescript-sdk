import type { Sink } from "@apibara/indexer";
import type { ConfigWatcher, ResolvedConfig, WatchConfigOptions } from "c12";
import type { DeepPartial } from "./_utils";
import type { PresetName } from "./presets";
import type { RollupConfig } from "./rollup";

/**
 * Apibara Config type (apibara.config)
 */
export interface ApibaraConfig
  extends DeepPartial<Omit<ApibaraOptions, "preset">> {
  sink?: {
    default: Sink;
    [key: string]: Sink;
  };
  dev?: boolean;
  runtimeConfig?: RuntimeConfig;
  presets?: {
    [key: string]: Partial<ApibaraConfig>;
  };
  preset?: string;
}

export interface RuntimeConfig {
  [key: string]: unknown;
}

export type ApibaraDynamicConfig = Pick<ApibaraConfig, "runtimeConfig">;

/**
 * Config loader options
 */
export interface LoadConfigOptions {
  watch?: boolean;
  c12?: WatchConfigOptions;
}

export interface ApibaraOptions {
  // Internal
  _config: ApibaraConfig;
  _c12: ResolvedConfig<ApibaraConfig> | ConfigWatcher<ApibaraConfig>;
  // General
  debug: boolean;
  preset: PresetName;
  runtimeConfig: RuntimeConfig;
  rootDir: string;
  outputDir: string;
  // Dev
  dev: boolean;
  rollupConfig?: RollupConfig;
}
