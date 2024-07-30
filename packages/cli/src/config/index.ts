import type { ApibaraConfig, DeepPartial } from "apibara/types";

export function defineConfig<
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  T extends Record<string, DeepPartial<ApibaraConfig<T, R>>> = {},
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  R extends Record<string, unknown> = {},
>(config: ApibaraConfig<T, R>): ApibaraConfig<T, R> {
  return config;
}
