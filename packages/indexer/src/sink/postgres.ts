/** PostgreSQL sink options. */
export type Postgres = {
  sinkType: "postgres";
  sinkOptions: {
    /** Postgres connection string. */
    connectionString?: string;
    /** Target table name. */
    tableName?: string;
  };
};
