import assert from "node:assert";

import consola from "consola";
import {
  type ChannelCredentials,
  type ChannelOptions,
  type DefaultCallOptions,
  Metadata,
  type NormalizedServiceDefinition,
  createChannel,
  createClient as grpcCreateClient,
} from "nice-grpc";

import * as proto from "./proto";

import type { Codec } from "./codec";
import type { Cursor } from "./common";
import type { StreamConfig } from "./config";
import { StatusRequest, StatusResponse } from "./status";
import { type StreamDataRequest, StreamDataResponse } from "./stream";

export { ClientError, ServerError, Status, Metadata } from "nice-grpc";

const DEFAULT_TIMEOUT_MS = 45_000;

export class TimeoutError extends Error {
  constructor(timeout: number) {
    super(`No message received in ${timeout}ms`);
    this.name = "TimeoutError";
  }
}

/** Client call options. */
export interface ClientCallOptions {
  signal?: AbortSignal;
}

export interface StreamDataOptions extends ClientCallOptions {
  /** Stop at the specified cursor (inclusive). */
  endingCursor?: Cursor;
  /** Timeout between messages, in milliseconds. */
  timeout?: number;
}

/** DNA client. */
export interface Client<TFilter, TBlock> {
  /** Fetch the DNA stream status. */
  status(
    request?: StatusRequest,
    options?: ClientCallOptions,
  ): Promise<StatusResponse>;

  /** Start streaming data from the DNA server. */
  streamData(
    request: StreamDataRequest<TFilter>,
    options?: StreamDataOptions,
  ): AsyncIterable<StreamDataResponse<TBlock>>;
}

export type CreateClientOptions = {
  defaultCallOptions?: DefaultCallOptions<
    NormalizedServiceDefinition<proto.stream.DnaStreamDefinition>
  >;
  credentials?: ChannelCredentials;
  channelOptions?: ChannelOptions;
};

/** Create a client connecting to the DNA grpc service. */
export function createClient<TFilter, TBlock>(
  config: StreamConfig<TFilter, TBlock>,
  streamUrl: string,
  options: CreateClientOptions = {},
) {
  const channel = createChannel(
    streamUrl,
    options?.credentials,
    options?.channelOptions,
  );

  const client: proto.stream.DnaStreamClient = grpcCreateClient(
    proto.stream.DnaStreamDefinition,
    channel,
    options?.defaultCallOptions,
  );

  return new GrpcClient(config, client);
}

export function createAuthenticatedClient<TFilter, TBlock>(
  config: StreamConfig<TFilter, TBlock>,
  streamUrl: string,
  options?: CreateClientOptions,
) {
  const dnaToken = process.env.DNA_TOKEN;
  if (!dnaToken) {
    consola.warn(
      "DNA_TOKEN environment variable is not set. Trying to connect without authentication.",
    );
  }

  return createClient(config, streamUrl, {
    ...options,
    defaultCallOptions: {
      ...(options?.defaultCallOptions ?? {}),
      "*": {
        metadata: Metadata({
          Authorization: `Bearer ${dnaToken}`,
        }),
        // metadata cant be overrided with spread as its a class so we override it fully if user provided it.
        ...(options?.defaultCallOptions?.["*"] ?? {}),
      },
    },
  });
}

export class GrpcClient<TFilter, TBlock> implements Client<TFilter, TBlock> {
  private encodeRequest;

  constructor(
    private config: StreamConfig<TFilter, TBlock>,
    private client: proto.stream.DnaStreamClient,
  ) {
    this.encodeRequest = config.Request.encode;
  }

  async status(request?: StatusRequest, options?: ClientCallOptions) {
    const response = await this.client.status(
      StatusRequest.encode(request ?? {}),
      options,
    );
    return StatusResponse.decode(response);
  }

  streamData(request: StreamDataRequest<TFilter>, options?: StreamDataOptions) {
    const it = this.client.streamData(this.encodeRequest(request), options);
    return new StreamDataIterable(it, this.config.Block, options);
  }
}

export class StreamDataIterable<TBlock> {
  constructor(
    private it: AsyncIterable<proto.stream.StreamDataResponse>,
    private schema: Codec<TBlock, Uint8Array>,
    private options?: StreamDataOptions,
  ) {}

  [Symbol.asyncIterator](): AsyncIterator<StreamDataResponse<TBlock>> {
    const inner = this.it[Symbol.asyncIterator]();
    const schema = StreamDataResponse(this.schema);
    const decoder = schema.decode;
    const { endingCursor, timeout = DEFAULT_TIMEOUT_MS } = this.options ?? {};
    let shouldStop = false;

    let clock: string | number | NodeJS.Timeout | undefined;

    return {
      async next() {
        if (shouldStop) {
          return { done: true, value: undefined };
        }

        // biome-ignore lint/suspicious/noExplicitAny: any is ok
        const t: Promise<{ done: boolean; value: any }> = new Promise(
          (_, reject) => {
            clock = setTimeout(() => {
              reject(new TimeoutError(timeout));
            }, timeout);
          },
        );

        try {
          const { done, value } = await Promise.race([inner.next(), t]);

          clearTimeout(clock);

          if (done || value.message === undefined) {
            return { done: true, value: undefined };
          }

          const decodedMessage = decoder(value.message);

          if (endingCursor) {
            assert(value.message.$case === "data");
            assert(decodedMessage._tag === "data");

            const { orderKey, uniqueKey } = endingCursor;
            const endCursor = decodedMessage.data.endCursor;

            // Check if the orderKey matches
            if (orderKey === endCursor?.orderKey) {
              // If a uniqueKey is specified, it must also match
              if (!uniqueKey || uniqueKey === endCursor.uniqueKey) {
                shouldStop = true;
                return { done: false, value: decodedMessage };
              }
            }
          }

          return {
            done: false,
            value: decodedMessage,
          };
        } finally {
          clearTimeout(clock);
        }
      },
    };
  }
}
