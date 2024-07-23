import type { Sink } from "@apibara/indexer";
import type {
  C12InputConfig,
  ConfigWatcher,
  ResolvedConfig,
  WatchConfigOptions,
} from "c12";
import type { WatchOptions } from "chokidar";
import type { NestedHooks } from "hookable";
import type { DeepPartial } from "./_utils";
import type { ApibaraHooks } from "./hooks";
import type { RollupConfig } from "./rollup";

/**
 * Apibara Config type (apibara.config)
 */
export interface ApibaraConfig<
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  T extends Record<string, Partial<ApibaraConfig<T>>> = {},
> extends DeepPartial<Omit<ApibaraOptions<T>, "preset" | "presets">>,
    C12InputConfig<ApibaraConfig> {
  sink?: {
    default: Sink;
    [key: string]: Sink;
  };
  dev?: boolean;
  runtimeConfig?: ApibaraRuntimeConfig;
  presets?: T;
  preset?: keyof T;
}

export interface ApibaraRuntimeConfig {
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

export interface ApibaraOptions<
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  T extends Record<string, Partial<ApibaraConfig<T>>> = {},
> {
  // Internal
  _config: ApibaraConfig<T>;
  _c12: ResolvedConfig<ApibaraConfig<T>> | ConfigWatcher<ApibaraConfig<T>>;

  // Sink
  sink: {
    default: Sink;
    [key: string]: Sink;
  };

  // Presets
  presets?: T;
  preset?: keyof T;

  // General
  debug: boolean;
  runtimeConfig: ApibaraRuntimeConfig;
  rootDir: string;
  outputDir: string;
  // Dev
  dev: boolean;
  watchOptions: WatchOptions;

  // Hooks
  hooks: NestedHooks<ApibaraHooks>;
  // Rollup
  rollupConfig?: RollupConfig;
  entry: string;
}
