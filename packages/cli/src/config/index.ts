import type { ApibaraConfig, DeepPartial } from "apibara/types";

export function defineConfig<
  T extends Record<string, DeepPartial<ApibaraConfig<T, R>>> = Record<
    string,
    never
  >,
  R extends Record<string, unknown> = Record<string, never>,
>(config: ApibaraConfig<T, R>): ApibaraConfig<T, R> {
  return config;
}
