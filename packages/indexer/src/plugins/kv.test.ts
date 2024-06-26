import { type Database, open } from "sqlite";
import sqlite3 from "sqlite3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { KVStore } from "./kv";

type ValueType = { data: bigint };

describe("KVStore", () => {
  let db: Database<sqlite3.Database, sqlite3.Statement>;
  let store: KVStore;
  const key = "test_key";

  beforeAll(async () => {
    db = await open({ driver: sqlite3.Database, filename: ":memory:" });
    await KVStore.initialize(db);
    store = new KVStore(db, "finalized", { orderKey: 5_000_000n });
  });

  afterAll(async () => {
    await db.close();
  });

  it("should begin transaction", async () => {
    await store.beginTransaction();
  });

  it("should put and get a value", async () => {
    const value = { data: 0n };

    await store.put<ValueType>(key, value);
    const result = await store.get<ValueType>(key);

    expect(result).toEqual(value);
  });

  it("should commit transaction", async () => {
    await store.commitTransaction();

    const value = { data: 0n };

    const result = await store.get<ValueType>(key);

    expect(result).toEqual(value);
  });

  it("should return undefined for non-existing key", async () => {
    const result = await store.get<ValueType>("non_existent_key");
    expect(result).toBeUndefined();
  });

  it("should begin transaction", async () => {
    await store.beginTransaction();
  });

  it("should update an existing value", async () => {
    store = new KVStore(db, "finalized", { orderKey: 5_000_020n });

    const value = { data: 50n };

    await store.put<ValueType>(key, value);
    const result = await store.get<ValueType>(key);

    expect(result).toEqual(value);
  });

  it("should delete a value", async () => {
    await store.del(key);
    const result = await store.get<ValueType>(key);

    expect(result).toBeUndefined();

    const rows = await db.all(
      `
      SELECT from_block, to_block, k, v
      FROM kvs
      WHERE k = ?
    `,
      [key],
    );

    // Check that the old is correctly marked with to_block
    expect(rows[0].to_block).toBe(Number(5_000_020n));
  });

  it("should rollback transaction", async () => {
    await store.rollbackTransaction();
  });

  it("should revert the changes to last commit", async () => {
    const rows = await db.all(
      `
      SELECT from_block, to_block, k, v
      FROM kvs
      WHERE k = ?
    `,
      [key],
    );

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
