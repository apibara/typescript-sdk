import Database, { type Database as SqliteDatabase } from "better-sqlite3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { KVStore } from "./kv";

type ValueType = { data: bigint };

type DatabaseRowType = {
  from_block: number;
  k: string;
  to_block: number;
  v: unknown;
};

describe("KVStore", () => {
  let db: SqliteDatabase;
  let store: KVStore;
  const key = "test_key";

  beforeAll(() => {
    db = new Database(":memory:");
    KVStore.initialize(db);
    store = new KVStore(db, "finalized", { orderKey: 5_000_000n });
  });

  afterAll(async () => {
    db.close();
  });

  it("should begin transaction", () => {
    store.beginTransaction();
  });

  it("should put and get a value", async () => {
    const value = { data: 0n };

    store.put<ValueType>(key, value);
    const result = store.get<ValueType>(key);

    expect(result).toEqual(value);
  });

  it("should commit transaction", async () => {
    store.commitTransaction();

    const value = { data: 0n };

    const result = store.get<ValueType>(key);

    expect(result).toEqual(value);
  });

  it("should return undefined for non-existing key", async () => {
    const result = store.get<ValueType>("non_existent_key");
    expect(result).toBeUndefined();
  });

  it("should begin transaction", async () => {
    store.beginTransaction();
  });

  it("should update an existing value", async () => {
    store = new KVStore(db, "finalized", { orderKey: 5_000_020n });

    const value = { data: 50n };

    store.put<ValueType>(key, value);
    const result = store.get<ValueType>(key);

    expect(result).toEqual(value);
  });

  it("should delete a value", async () => {
    store.del(key);
    const result = store.get<ValueType>(key);

    expect(result).toBeUndefined();

    const rows = db
      .prepare<string, DatabaseRowType>(
        `
      SELECT from_block, to_block, k, v
      FROM kvs
      WHERE k = ?
    `,
      )
      .all(key);

    // Check that the old is correctly marked with to_block
    expect(rows[0].to_block).toBe(Number(5_000_020n));
  });

  it("should rollback transaction", async () => {
    await store.rollbackTransaction();
  });

  it("should revert the changes to last commit", async () => {
    const rows = db
      .prepare(
        `
      SELECT from_block, to_block, k, v
      FROM kvs
      WHERE k = ?
    `,
      )
      .all([key]);

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "from_block": 5000000,
          "k": "test_key",
          "to_block": null,
          "v": "{
      	"data": "0n"
      }",
        },
      ]
    `);
  });
});
