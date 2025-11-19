import { run } from "@apibara/indexer";
import {
  type InvalidateConfig,
  generateMockMessages,
  getMockIndexer,
} from "@apibara/indexer/internal/testing";
import {
  type MockBlock,
  MockClient,
  type MockFilter,
} from "@apibara/protocol/testing";
import { describe, expect, it } from "vitest";
import { drizzleStorage, useDrizzleStorage } from "../src";
import { chainReorganizations, checkpoints } from "../src/persistence";
import { getPgliteDb, testTable } from "./helper";

describe("Drizzle reorg", () => {
  it("should record single chain reorganization", async () => {
    const db = await getPgliteDb();

    const indexer = getMockIndexer({
      override: {
        plugins: [
          drizzleStorage({
            db,
            persistState: true,
            recordChainReorganizations: true,
          }),
        ],
        async transform({ endCursor, block: { data } }) {
          const { db: tx } = useDrizzleStorage(db);

          await tx.insert(testTable).values({
            blockNumber: Number(endCursor?.orderKey),
            data,
          });
        },
      },
    });

    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
        return generateMockMessages(10, {
          uniqueKey: true,
          baseBlockNumber: 1000n,
          // invalidate at message 8, rolling back to block 1005
          invalidate: { invalidateTriggerIndex: 8, invalidateFromIndex: 5 },
        });
      },
    );

    await run(mockClient, indexer);

    const checkpointsResult = await db.select().from(checkpoints);
    expect(checkpointsResult).toMatchInlineSnapshot(`
      [
        {
          "id": "indexer_testing_default",
          "orderKey": 1009,
          "uniqueKey": "0xff001009",
        },
      ]
    `);

    const reorgsResult = await db.select().from(chainReorganizations);
    expect(reorgsResult.length).toBe(1);

    const reorg = reorgsResult[0];
    expect(reorg.oldHeadOrderKey).toBe(1007);
    expect(reorg.oldHeadUniqueKey).toBe("0xff001007");
    expect(reorg.newHeadOrderKey).toBe(1005);
    expect(reorg.newHeadUniqueKey).toBe("0xff001005");
    expect(reorg.recordedAt).toBeInstanceOf(Date);
    expect(reorg.indexerId).toBe("indexer_testing_default");
  });

  it("should record multiple chain reorganizations", async () => {
    const db = await getPgliteDb();

    const indexer = getMockIndexer({
      override: {
        plugins: [
          drizzleStorage({
            db,
            persistState: true,
            recordChainReorganizations: true,
          }),
        ],
        async transform({ endCursor, block: { data } }) {
          const { db: tx } = useDrizzleStorage(db);

          await tx.insert(testTable).values({
            blockNumber: Number(endCursor?.orderKey),
            data,
          });
        },
      },
    });

    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
        const invalidateConfigs: InvalidateConfig[] = [
          { invalidateTriggerIndex: 8, invalidateFromIndex: 5 },
          { invalidateTriggerIndex: 15, invalidateFromIndex: 12 },
        ];
        return generateMockMessages(20, {
          uniqueKey: true,
          baseBlockNumber: 100n,
          invalidate: invalidateConfigs,
        });
      },
    );

    await run(mockClient, indexer);

    const reorgsResult = await db
      .select()
      .from(chainReorganizations)
      .orderBy(chainReorganizations.id);

    expect(reorgsResult.length).toBe(2);

    const firstReorg = reorgsResult[0];
    expect(firstReorg.oldHeadOrderKey).toBe(107);
    expect(firstReorg.oldHeadUniqueKey).toBe("0xff00107");
    expect(firstReorg.newHeadOrderKey).toBe(105);
    expect(firstReorg.newHeadUniqueKey).toBe("0xff00105");

    const secondReorg = reorgsResult[1];
    expect(secondReorg.oldHeadOrderKey).toBe(114);
    expect(secondReorg.oldHeadUniqueKey).toBe("0xff00114");
    expect(secondReorg.newHeadOrderKey).toBe(112);
    expect(secondReorg.newHeadUniqueKey).toBe("0xff00112");

    const checkpointsResult = await db.select().from(checkpoints);
    expect(checkpointsResult[0].orderKey).toBe(119);
  });

  it("should NOT record reorgs when flag is disabled", async () => {
    const db = await getPgliteDb();

    const indexer = getMockIndexer({
      override: {
        plugins: [
          drizzleStorage({
            db,
            persistState: true,
            recordChainReorganizations: false,
          }),
        ],
        async transform({ endCursor, block: { data } }) {
          const { db: tx } = useDrizzleStorage(db);

          await tx.insert(testTable).values({
            blockNumber: Number(endCursor?.orderKey),
            data,
          });
        },
      },
    });

    const mockClient = new MockClient<MockFilter, MockBlock>(
      (request, options) => {
        return generateMockMessages(10, {
          uniqueKey: true,
          baseBlockNumber: 1000n,
          invalidate: { invalidateTriggerIndex: 8, invalidateFromIndex: 5 },
        });
      },
    );

    await run(mockClient, indexer);

    const reorgsResult = await db.select().from(chainReorganizations);
    expect(reorgsResult.length).toBe(0);
  });
});
