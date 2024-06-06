import {
  type DefaultCallOptions,
  type NormalizedServiceDefinition,
  createClient as grpcCreateClient,
  createChannel,
} from "nice-grpc";
import { Schema } from "@effect/schema";

import * as proto from "./proto";

import type { StreamConfig } from "./config";
import {
  type StatusRequest,
  statusRequestToProto,
  statusResponseFromProto,
  type StatusResponse,
} from "./status";
import { type StreamDataRequest, StreamDataResponse } from "./stream";

/** Client call options. */
export interface ClientCallOptions {
  signal?: AbortSignal;
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
    options?: ClientCallOptions,
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

  streamData(request: StreamDataRequest<TFilter>, options?: ClientCallOptions) {
    const it = this.client.streamData(this.encodeRequest(request), options);
    return new StreamDataIterable(it, this.config.Block);
  }
}

export class StreamDataIterable<TBlock> {
  constructor(
    private it: AsyncIterable<proto.stream.StreamDataResponse>,
    private schema: Schema.Schema<TBlock, Uint8Array, never>,
  ) {}

  [Symbol.asyncIterator](): AsyncIterator<StreamDataResponse<TBlock>> {
    const inner = this.it[Symbol.asyncIterator]();
    const schema = StreamDataResponse(this.schema);
    const decoder = Schema.decodeSync(schema);

    return {
      async next() {
        const { done, value } = await inner.next();

        if (done || value.message === undefined) {
          return { done: true, value: undefined };
        }

        return {
          done: false,
          value: decoder(value.message),
        };
      },
    };
  }
}
