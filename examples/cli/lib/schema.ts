import { pgIndexerTable } from "@apibara/indexer/sinks/drizzle";
import { bigint, text } from "drizzle-orm/pg-core";

export const starknetUsdcTransfers = pgIndexerTable("starknet_usdc_transfers", {
  number: bigint("number", { mode: "number" }),
  hash: text("hash"),
});

export const ethereumUsdcTransfers = pgIndexerTable("ethereum_usdc_transfers", {
  number: bigint("number", { mode: "number" }),
  hash: text("hash"),
});

export {
  checkpoints,
  filters,
} from "@apibara/indexer/plugins/drizzle-persistence";
