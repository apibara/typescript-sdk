import type { RollupCommonJSOptions } from "@rollup/plugin-commonjs";
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
  T extends Record<string, DeepPartial<ApibaraConfig<T, R>>> = Record<
    string,
    never
  >,
  R extends Record<string, unknown> = Record<string, never>,
> extends DeepPartial<Omit<ApibaraOptions<T, R>, "preset" | "presets" | "dev">>,
    C12InputConfig<ApibaraConfig<T, R>> {
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
  T extends Record<string, DeepPartial<ApibaraConfig<T, R>>> = Record<
    string,
    never
  >,
  R extends Record<string, unknown> = Record<string, never>,
> {
  // Internal
  _config: ApibaraConfig<T, R>;
  _c12:
    | ResolvedConfig<ApibaraConfig<T, R>>
    | ConfigWatcher<ApibaraConfig<T, R>>;

  // Presets
  presets?: T;
  preset?: keyof T;

  // General
  debug: boolean;
  runtimeConfig: R;
  rootDir: string;
  buildDir: string;
  outputDir: string;
  indexersDir: string;

  // Dev
  dev: boolean;
  watchOptions: WatchOptions;

  // Hooks
  hooks: NestedHooks<ApibaraHooks>;

  // Rollup
  rollupConfig?: RollupConfig;
  sourceMap?: boolean;
  entry: string;
  commonJS?: RollupCommonJSOptions;

  // Advanced
  typescript: {
    strict?: boolean;
    internalPaths?: boolean;
    generateRuntimeConfigTypes?: boolean;
  };
}
