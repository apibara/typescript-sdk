import { promisify } from 'util'
import {
  loadPackageDefinition,
  credentials as grpcCredentials,
  ClientOptions,
  ChannelCredentials,
} from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'
import { Retry, neverRetry, defaultOnRetry, StreamMessagesStream } from './stream'
import { NodeClient as GrpcNodeClient } from './proto/apibara/node/v1alpha1/Node'
import { ProtoGrpcType } from './proto/node'
import { StatusResponse__Output } from './proto/apibara/node/v1alpha1/StatusResponse'
import { StreamMessagesRequest } from './proto/apibara/node/v1alpha1/StreamMessagesRequest'

const __NODE_PROTO_PATH = __dirname + '/proto/node.proto'

const packageDefinition = loadSync(__NODE_PROTO_PATH, {})
const protoDescriptor = loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType

export const Node = protoDescriptor.apibara.node.v1alpha1.Node

export const credentials = grpcCredentials

export interface StreamMessagesOptions {
  reconnect?: boolean
  onRetry?: (retryCount: number) => Retry
}

export class NodeClient {
  private readonly client: GrpcNodeClient

  constructor(address: string, credentials: ChannelCredentials, options?: ClientOptions) {
    this.client = new Node(address, credentials, options)
  }

  public async status(): Promise<StatusResponse__Output | undefined> {
    return promisify(this.client.Status.bind(this.client, {}))()
  }

  public streamMessages(
    args: StreamMessagesRequest,
    options?: StreamMessagesOptions
  ): StreamMessagesStream {
    // only reconnect if user has opted-in
    let onRetry = neverRetry
    if (options?.reconnect) {
      if (options.onRetry) {
        onRetry = options.onRetry
      } else {
        onRetry = defaultOnRetry
      }
    }

    return new StreamMessagesStream({ args, onRetry, client: this.client })
  }
}
