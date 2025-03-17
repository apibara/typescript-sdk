import type { ConsolaReporter } from "@apibara/indexer/plugins";
import type {
  C12InputConfig,
  ConfigWatcher,
  ResolvedConfig,
  WatchConfigOptions,
} from "c12";
import type { NestedHooks } from "hookable";
import type { WatchOptions } from "rolldown";
import type { RolldownOptions } from "rolldown";
import type { DeepPartial } from "./_utils";
import type { ApibaraHooks } from "./hooks";

export type RegisterFn = () => Promise<void>;

export type LoggerFactoryFn = ({
  indexer,
  indexers,
  preset,
}: LoggerFactoryArgs) => ConsolaReporter;

export type LoggerFactoryArgs = {
  indexer: string;
  indexers: string[];
  preset?: string;
};

/**
 * Apibara Config type (apibara.config)
 */
export interface ApibaraConfig<
  T extends Record<
    string,
    DeepPartial<Pick<ApibaraConfig<T, R>, "runtimeConfig">>
  > = Record<string, never>,
  R extends Record<string, unknown> = Record<string, never>,
> extends Partial<Omit<ApibaraOptions<T, R>, "preset" | "presets" | "dev">>,
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
  T extends Record<
    string,
    DeepPartial<Pick<ApibaraConfig<T, R>, "runtimeConfig">>
  > = Record<string, never>,
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
  watchOptions: WatchOptions["watch"];

  // Hooks
  hooks: NestedHooks<ApibaraHooks>;

  // Rolldown
  rolldownConfig?: Partial<RolldownOptions>;

  /**
   * @deprecated Use rolldownConfig instead. This option will be removed in future releases.
   */
  rollupConfig?: unknown;
  sourceMap?: boolean;
  entry: string;
  node: boolean;
  exportConditions?: string[];

  // Advanced
  typescript: {
    strict?: boolean;
    internalPaths?: boolean;
    generateRuntimeConfigTypes?: boolean;
  };
}
