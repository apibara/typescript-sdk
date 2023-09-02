/** MongoDB sink options */
export type Mongo = {
  sinkType: "mongo";
  sinkOptions: {
    /** MongoDB connection string. */
    connectionString?: string;
    /** Target database name. */
    database?: string;
    /** Target collection name. */
    collectionName?: string;
    /** Enable entity mode. */
    entityMode?: boolean;
  };
};
