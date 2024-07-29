import { createIndexer } from "@apibara/indexer";
import { createIndexerConfig } from "../indexer";

export default createIndexer(
  createIndexerConfig("http://mainnet-v2.starknet.a5a.ch:7007"),
);
