import type { PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import type * as schema from "@/lib/schema";

export async function migratePglite(database: PgliteDatabase<typeof schema>) {
  return await migrate(database, { migrationsFolder: "./drizzle" });
}
