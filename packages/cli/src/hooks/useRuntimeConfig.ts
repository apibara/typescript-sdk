import type { ApibaraRuntimeConfig } from "apibara/types";

export function useRuntimeConfig(): ApibaraRuntimeConfig {
  return JSON.parse(process.env.APIBARA_RUNTIME_CONFIG_HOOK_DATA || "{}");
}
