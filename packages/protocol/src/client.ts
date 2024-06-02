import {
  type CallOptions,
  type Channel,
  type DefaultCallOptions,
  type NormalizedServiceDefinition,
  createClient as grpcCreateClient,
} from "nice-grpc";
import { Schema } from "@effect/schema";

import * as proto from "./proto";

import {
  type StatusRequest,
  statusRequestToProto,
  statusResponseFromProto,
} from "./status";
import { StreamDataRequest, StreamDataResponse } from "./stream";

export class StreamConfig<TFilter, TBlock> {
  public RequestSchema;
  public ResponseSchema;

  constructor(
    private filter: Schema.Schema<TFilter, Uint8Array, never>,
    private block: Schema.Schema<TBlock, Uint8Array, never>,
  ) {
    this.RequestSchema = StreamDataRequest(this.filter);
    this.ResponseSchema = StreamDataResponse(this.block);
  }

  get Filter() {
    return this.filter;
  }

  get Block() {
    return this.block;
  }

  get Request() {
    return this.RequestSchema;
  }

  get Response() {
    return this.ResponseSchema;
  }
}

export function createClient<TFilter, TBlock>(
  config: StreamConfig<TFilter, TBlock>,
  channel: Channel,
  defaultCallOptions?: DefaultCallOptions<
    NormalizedServiceDefinition<proto.stream.DnaStreamDefinition>
  >,
) {
  const client: proto.stream.DnaStreamClient = grpcCreateClient(
    proto.stream.DnaStreamDefinition,
    channel,
    defaultCallOptions,
  );
  return new Client(config, client);
}

export class Client<TFilter, TBlock> {
  private encodeRequest;

  constructor(
    private config: StreamConfig<TFilter, TBlock>,
    private client: proto.stream.DnaStreamClient,
  ) {
    this.encodeRequest = Schema.encodeSync(config.RequestSchema);
  }

  async status(request?: StatusRequest, options?: CallOptions) {
    const response = await this.client.status(
      statusRequestToProto(request ?? {}),
      options,
    );
    return statusResponseFromProto(response);
  }

  streamData(request: StreamDataRequest<TFilter>, options?: CallOptions) {
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
