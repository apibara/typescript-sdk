import util from "util";
import {
  CallOptions,
  Channel,
  DefaultCallOptions,
  NormalizedServiceDefinition,
  createClient as grpcCreateClient,
} from "nice-grpc";

import * as proto from "./proto";

import { StatusRequest, StatusResponse } from "./status";
import {
  StreamDataRequest,
  StreamDataResponse,
  StreamDataResponseFromMessage,
} from "./stream";
import { Schema } from "@effect/schema";

export function createClient(
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
  return new Client(client);
}

export class Client {
  constructor(private client: proto.stream.DnaStreamClient) {}

  async status(request?: StatusRequest, options?: CallOptions) {
    const response = await this.client.status(
      request?.toProto() ?? {},
      options,
    );
    return StatusResponse.fromProto(response);
  }

  streamData(request: StreamDataRequest, options?: CallOptions) {
    const it = this.client.streamData(request.toProto(), options);
    return new StreamDataIterable(it);
  }
}

export class StreamDataIterable {
  constructor(private it: AsyncIterable<proto.stream.StreamDataResponse>) {}

  [Symbol.asyncIterator](): AsyncIterator<StreamDataResponse> {
    const decoder = Schema.decodeSync(StreamDataResponseFromMessage);
    const inner = this.it[Symbol.asyncIterator]();
    return {
      async next() {
        const { done, value } = await inner.next();

        if (done) {
          return { done: true, value: undefined };
        }

        console.log("raw message", util.inspect(value, { depth: null }));
        return {
          done: false,
          value: decoder(value),
        };
      },
    };
  }
}
