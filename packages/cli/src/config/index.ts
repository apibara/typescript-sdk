import type { ApibaraConfig } from "../types/config";

export function defineConfig<
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  T extends Record<string, Partial<ApibaraConfig<T>>> = {},
>(config: ApibaraConfig<T>): ApibaraConfig<T> {
  return config;
}
