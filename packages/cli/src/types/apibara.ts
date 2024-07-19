import type { Hookable } from "hookable";
import type { ApibaraDynamicConfig, ApibaraOptions } from "./config";
import type { ApibaraHooks } from "./hooks";

export interface Apibara {
  options: ApibaraOptions;
  hooks: Hookable<ApibaraHooks>;
  close: () => Promise<void>;
  updateConfig: (config: ApibaraDynamicConfig) => void | Promise<void>;
}
