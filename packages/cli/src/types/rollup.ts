import type {
  InputOptions as RollupInputOptions,
  OutputOptions as RollupOutputOptions,
} from "rollup";

export type RollupConfig = RollupInputOptions & {
  output: RollupOutputOptions;
};
