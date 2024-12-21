import type { ClientSession, MongoClient } from "mongodb";

export class MongoStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MongoStorageError";
  }
}

export async function withTransaction<T>(
  client: MongoClient,
  cb: (session: ClientSession) => Promise<T>,
) {
  return await client.withSession(async (session) => {
    return await session.withTransaction(async (session) => {
      return await cb(session);
    });
  });
}
