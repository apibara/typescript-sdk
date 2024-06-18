import { Schema } from "@effect/schema";
import {
  type DefaultCallOptions,
  type NormalizedServiceDefinition,
  createChannel,
  createClient as grpcCreateClient,
} from "nice-grpc";

import * as proto from "./proto";

import assert from "node:assert";
import type { Cursor } from "./common";
import type { StreamConfig } from "./config";
import {
  type StatusRequest,
  type StatusResponse,
  statusRequestToProto,
  statusResponseFromProto,
} from "./status";
import { type StreamDataRequest, StreamDataResponse } from "./stream";

/** Client call options. */
export interface ClientCallOptions {
  signal?: AbortSignal;
}

export interface StreamDataOptions extends ClientCallOptions {
  /** Stop at the specified cursor (inclusive) */
  endingCursor?: Cursor;
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

/** Create a client connecting to the DNA grpc service. */
export function createClient<TFilter, TBlock>(
  config: StreamConfig<TFilter, TBlock>,
  streamUrl: string,
  defaultCallOptions?: DefaultCallOptions<
    NormalizedServiceDefinition<proto.stream.DnaStreamDefinition>
  >,
) {
  const channel = createChannel(streamUrl);
  const client: proto.stream.DnaStreamClient = grpcCreateClient(
    proto.stream.DnaStreamDefinition,
    channel,
    defaultCallOptions,
  );
  return new GrpcClient(config, client);
}

export class GrpcClient<TFilter, TBlock> implements Client<TFilter, TBlock> {
  private encodeRequest;

  constructor(
    private config: StreamConfig<TFilter, TBlock>,
    private client: proto.stream.DnaStreamClient,
  ) {
    this.encodeRequest = Schema.encodeSync(config.Request);
  }

  async status(request?: StatusRequest, options?: ClientCallOptions) {
    const response = await this.client.status(
      statusRequestToProto(request ?? {}),
      options,
    );
    return statusResponseFromProto(response);
  }

  streamData(request: StreamDataRequest<TFilter>, options?: StreamDataOptions) {
    const it = this.client.streamData(this.encodeRequest(request), options);
    return new StreamDataIterable(it, this.config.Block, options);
  }
}

export class StreamDataIterable<TBlock> {
  constructor(
    private it: AsyncIterable<proto.stream.StreamDataResponse>,
    private schema: Schema.Schema<TBlock, Uint8Array, never>,
    private options?: StreamDataOptions,
  ) {}

  [Symbol.asyncIterator](): AsyncIterator<StreamDataResponse<TBlock>> {
    const inner = this.it[Symbol.asyncIterator]();
    const schema = StreamDataResponse(this.schema);
    const decoder = Schema.decodeSync(schema);
    const { endingCursor } = this.options ?? {};
    let shouldStop = false;

    return {
      async next() {
        if (shouldStop) {
          return { done: true, value: undefined };
        }

        const { done, value } = await inner.next();

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
      },
    };
  }
}
