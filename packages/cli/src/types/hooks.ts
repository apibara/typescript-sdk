import type { Apibara } from "./apibara";
import type { RollupConfig } from "./rollup";

export interface ApibaraHooks {
  "rollup:before": (apibara: Apibara, rollupConfig: RollupConfig) => void;
  compiled: (apibara: Apibara) => void;
  "dev:reload": () => void;
  "rollup:reload": () => void;
  restart: () => void;
  close: () => void;
}
