import consola from "consola";
import { EvmStream } from "@apibara/evm";
import { defineIndexer } from "@apibara/indexer";

export function createIndexerConfig(streamUrl: string) {
  return defineIndexer(EvmStream)({
    streamUrl,
    finality: "accepted",
    startingCursor: {
      orderKey: 5_000_000n,
    },
    filter: {
      header: {
        always: true,
      },
    },
    transform({ header }) {
      return header;
    },
    hooks: {
      "run:before": () => {
        consola.info("before run");
      },
      "run:after": () => {
        consola.info("after run");
      },
    },
  });
}
