import type { ApibaraOptions } from "../../types/config";

export async function resolveRuntimeConfigOptions(options: ApibaraOptions) {
  options.runtimeConfig = { ...options.runtimeConfig, default: "value" };
}
