import type { ConsolaInstance } from "consola";
import type { Hookable } from "hookable";
import type { ApibaraDynamicConfig, ApibaraOptions } from "./config";
import type { ApibaraHooks } from "./hooks";

export interface Apibara {
  options: ApibaraOptions;
  hooks: Hookable<ApibaraHooks>;
  logger: ConsolaInstance;
  close: () => Promise<void>;
  updateConfig: (config: ApibaraDynamicConfig) => void | Promise<void>;
}
