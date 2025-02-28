import type { IndexerWithStreamConfig } from "@apibara/indexer";
import type { ApibaraRuntimeConfig } from "apibara/types";

export type IndexerConstructor =
  | ((
      runtimeConfig: ApibaraRuntimeConfig,
    ) => IndexerWithStreamConfig<unknown, unknown, unknown>)
  | IndexerWithStreamConfig<unknown, unknown, unknown>;

export const indexers: {
  name: string;
  indexer: { default?: IndexerConstructor | undefined };
}[] = [];
