import type { Sink } from "@apibara/indexer";
import type {
  C12InputConfig,
  ConfigWatcher,
  ResolvedConfig,
  WatchConfigOptions,
} from "c12";
import type { WatchOptions } from "chokidar";
import type { NestedHooks } from "hookable";
import type { TSConfig } from "pkg-types";
import type { DeepPartial } from "./_utils";
import type { ApibaraHooks } from "./hooks";
import type { RollupConfig } from "./rollup";

/**
 * Apibara Config type (apibara.config)
 */
export interface ApibaraConfig<
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  T extends Record<string, DeepPartial<ApibaraConfig<T, R>>> = {},
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  R extends Record<string, unknown> = {},
> extends DeepPartial<Omit<ApibaraOptions<T, R>, "preset" | "presets" | "dev">>,
    C12InputConfig<ApibaraConfig<T, R>> {
  sink?: {
    default: () => Sink;
    [key: string]: () => Sink;
  };
  runtimeConfig?: R;
  presets?: T;
  preset?: keyof T;
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
  T extends Record<string, DeepPartial<ApibaraConfig<T, R>>> = {},
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  R extends Record<string, unknown> = {},
> {
  // Internal
  _config: ApibaraConfig<T, R>;
  _c12:
    | ResolvedConfig<ApibaraConfig<T, R>>
    | ConfigWatcher<ApibaraConfig<T, R>>;

  // Sink
  sink: {
    default: () => Sink;
    [key: string]: () => Sink;
  };

  // Presets
  presets?: T;
  preset?: keyof T;

  // General
  debug: boolean;
  runtimeConfig: R;
  rootDir: string;
  buildDir: string;
  outputDir: string;
  // Dev
  dev: boolean;
  watchOptions: WatchOptions;

  // Hooks
  hooks: NestedHooks<ApibaraHooks>;
  // Rollup
  rollupConfig?: RollupConfig;
  entry: string;
  minify: boolean;

  // Advanced
  typescript: {
    strict?: boolean;
    internalPaths?: boolean;
    generateRuntimeConfigTypes?: boolean;
    generateTsConfig?: boolean;
    /** the path of the generated `tsconfig.json`, relative to buildDir */
    tsconfigPath: string;
    tsConfig?: Partial<TSConfig>;
  };
}
