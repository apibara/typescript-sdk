import type { ApibaraRuntimeConfig } from "apibara/types";
import { deserialize } from "../utils/helper";

export function useRuntimeConfig(): ApibaraRuntimeConfig {
  return deserialize(process.env.APIBARA_RUNTIME_CONFIG || "{}");
}
