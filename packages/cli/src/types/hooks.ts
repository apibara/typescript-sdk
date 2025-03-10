import type { RolldownOptions } from "rolldown";
import type { Apibara } from "./apibara";

export interface ApibaraHooks {
  "rolldown:before": (
    apibara: Apibara,
    rolldownConfig: RolldownOptions,
  ) => void;
  compiled: (apibara: Apibara) => void;
  "dev:restart": () => Promise<void>;
  "dev:reload": () => Promise<void>;
  "rolldown:reload": () => Promise<void>;
  restart: () => void;
  close: () => void;
}
