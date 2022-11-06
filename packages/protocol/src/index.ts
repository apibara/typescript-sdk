import { promisify } from 'util'
import {
  loadPackageDefinition,
  credentials as grpcCredentials,
  ClientOptions,
  ChannelCredentials,
  ClientReadableStream,
} from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'
import { NodeClient as GrpcNodeClient } from './proto/apibara/node/v1alpha1/Node'
import { ProtoGrpcType } from './proto/node'
import { StatusResponse__Output } from './proto/apibara/node/v1alpha1/StatusResponse'
import { StreamMessagesResponse__Output } from './proto/apibara/node/v1alpha1/StreamMessagesResponse'

const __NODE_PROTO_PATH = __dirname + '/proto/node.proto'

const packageDefinition = loadSync(__NODE_PROTO_PATH, {})
const protoDescriptor = loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType

export const Node = protoDescriptor.apibara.node.v1alpha1.Node

export const credentials = grpcCredentials

export class NodeClient {
  private readonly client: GrpcNodeClient

  constructor(address: string, credentials: ChannelCredentials, options?: ClientOptions) {
    this.client = new Node(address, credentials, options)
  }

  public async status(): Promise<StatusResponse__Output | undefined> {
    return promisify(this.client.Status.bind(this.client, {}))()
  }

  public streamMessages(): ClientReadableStream<StreamMessagesResponse__Output> {
    return this.client.streamMessages({})
  }
}
