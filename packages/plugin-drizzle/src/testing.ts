import type { VcrResult } from "@apibara/indexer/testing";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

export function getTestDatabase(context: VcrResult) {
  const { internalContext } = context;

  if (!internalContext) {
    throw new Error("Internal context not found");
  }

  if (!internalContext.drizzleStorageDB) {
    throw new Error("Drizzle database not found in Internal Context");
  }

  return internalContext.drizzleStorageDB as PgDatabase<PgQueryResultHKT>;
}
