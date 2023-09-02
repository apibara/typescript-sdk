export type Parquet = {
  sinkType: "parquet";
  sinkOptions: {
    /** Target output directory. */
    outputDir?: string;
    /** How many blocks to include in each file. */
    batchSize?: number;
  };
};
