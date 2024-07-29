import { createIndexer } from "@apibara/indexer";
import { createIndexerConfig } from "../indexer";

export default function demoIndexer(runtimeConfig: unknown) {
  console.log("demoIndexer runtimeConfig", runtimeConfig);
  return createIndexer(
    createIndexerConfig("http://mainnet-v2.starknet.a5a.ch:7007"),
  );
}
