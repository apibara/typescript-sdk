/** Sink-related options. */
export type SinkOptions = {
  /** Sink type. */
  sinkType: string;
  /** Sink options. */
  sinkOptions: object;
};

/** Network-specific options. */
export type NetworkOptions = {
  /** Network name. */
  network: string;
  /** Data filter. */
  filter: object;
};

/** Data finality. */
export type Finality =
  | "DATA_STATUS_FINALIZED"
  | "DATA_STATUS_ACCEPTED"
  | "DATA_STATUS_PENDING";

/** Stream-related options. */
export type StreamOptions = {
  /** The Apibara DNA stream url, e.g. `mainnet.starknet.a5a.ch`. */
  streamUrl?: string;
  /** Maximum message size, e.g. `50Mb` */
  maxMessageSize?: string;
  /** Additional metadata to send when connecting to the stream, in `key: value` form. */
  metadata?: string[];
  /** The Apibara DNA stream auth token. */
  authToken?: string;
};

export type Config<
  TNetworkOptions extends NetworkOptions = NetworkOptions,
  TSink extends SinkOptions = SinkOptions,
> = TSink &
  TNetworkOptions &
  StreamOptions & {
    /** How many historical blocks to process in a single batch. */
    batchSize?: number;
    /** Finality of the data to process. */
    finality?: Finality;
    /** Start streaming data from this block. */
    startingBlock?: number;
  };
