import type { VcrResult } from "@apibara/indexer/testing";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { DRIZZLE_STORAGE_DB_PROPERTY } from "./constants";

export function getTestDatabase(context: VcrResult) {
  const db = context[DRIZZLE_STORAGE_DB_PROPERTY];

  if (!db) {
    throw new Error("Drizzle database not found in context");
  }

  return db as PgDatabase<PgQueryResultHKT>;
}
