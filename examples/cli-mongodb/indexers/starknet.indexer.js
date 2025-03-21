import { defineIndexer } from "@apibara/indexer";
import { useLogger } from "@apibara/indexer/plugins";
import { mongoStorage, useMongoStorage } from "@apibara/plugin-mongo";
import { StarknetStream } from "@apibara/starknet";
import { MongoClient } from "mongodb";

export default function (_runtimeConfig) {
  const mongodb = new MongoClient("mongodb://mongo:mongo@localhost:27017/");

  return defineIndexer(StarknetStream)({
    streamUrl: "https://starknet.preview.apibara.org",
    finality: "accepted",
    startingBlock: 1_000_000n,
    filter: {
      transactions: [{}],
    },
    plugins: [
      mongoStorage({
        client: mongodb,
        dbName: "test-db",
        collections: ["blocks", "transactions"],
      }),
    ],
    async transform({ block: { header, transactions } }) {
      const logger = useLogger();
      const mongo = useMongoStorage();

      await mongo.collection("blocks").insertOne(header);
      await mongo.collection("transactions").insertMany(transactions);

      logger.info(`Inserted block ${header.blockNumber}`);
    },
  });
}
