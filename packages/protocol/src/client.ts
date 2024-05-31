import {
  CallOptions,
  Channel,
  DefaultCallOptions,
  NormalizedServiceDefinition,
  createClient as grpcCreateClient,
} from "nice-grpc";
import { DnaStreamClient, DnaStreamDefinition } from "./proto/stream";
import { StatusRequest, StatusResponse } from "./status";

export function createClient(
  channel: Channel,
  defaultCallOptions?: DefaultCallOptions<
    NormalizedServiceDefinition<DnaStreamDefinition>
  >,
) {
  const client: DnaStreamClient = grpcCreateClient(
    DnaStreamDefinition,
    channel,
    defaultCallOptions,
  );
  return new Client(client);
}

export class Client {
  constructor(private client: DnaStreamClient) {}

  async status(request?: StatusRequest, options?: CallOptions) {
    const response = await this.client.status(
      request?.toProto() ?? {},
      options,
    );
    return StatusResponse.fromProto(response);
  }
}
