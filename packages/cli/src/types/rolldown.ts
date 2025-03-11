import type { InputOptions, OutputOptions } from "rolldown";

export type RolldownConfig = InputOptions & {
  output: OutputOptions;
};
