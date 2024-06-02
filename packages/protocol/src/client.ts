import {
  CallOptions,
  Channel,
  DefaultCallOptions,
  NormalizedServiceDefinition,
  createClient as grpcCreateClient,
} from "nice-grpc";
import { Schema } from "@effect/schema";

import * as proto from "./proto";

import {
  StatusRequest,
  statusRequestToProto,
  statusResponseFromProto,
} from "./status";
import { StreamDataRequest } from "./stream";

export class StreamConfig<TFilter> {
  public RequestSchema;

  constructor(private filter: Schema.Schema<TFilter, Uint8Array, never>) {
    this.RequestSchema = StreamDataRequest(this.filter);
  }

  get Request() {
    return this.RequestSchema;
  }
}

export function createClient<TFilter>(
  config: StreamConfig<TFilter>,
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

export class Client<TFilter> {
  private encodeRequest;

  constructor(
    config: StreamConfig<TFilter>,
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
    return new StreamDataIterable(it);
  }
}

export class StreamDataIterable {
  constructor(private it: AsyncIterable<proto.stream.StreamDataResponse>) {}

  [Symbol.asyncIterator](): AsyncIterator<number> {
    // const decoder = Schema.decodeSync(StreamDataResponseFromMessage);
    const inner = this.it[Symbol.asyncIterator]();
    return {
      async next() {
        const { done, value } = await inner.next();

        if (done) {
          return { done: true, value: undefined };
        }

        // console.log("raw message", util.inspect(value, { depth: null }));
        return {
          done: false,
          value: 42,
        };
      },
    };
  }
}
