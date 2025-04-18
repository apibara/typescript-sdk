import { ENV_INTERNAL_APIBARA_PROCESSED_RUNTIME } from "apibara/common";
import type { ApibaraRuntimeConfig } from "apibara/types";

export function useRuntimeConfig(): ApibaraRuntimeConfig {
  return JSON.parse(
    process.env[ENV_INTERNAL_APIBARA_PROCESSED_RUNTIME] || "{}",
  );
}
