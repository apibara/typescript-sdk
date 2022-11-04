import { promisify } from 'util'
import {
  loadPackageDefinition,
  credentials as grpcCredentials,
  ClientOptions,
  ChannelCredentials,
} from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'
import { NodeClient as GrpcNodeClient } from './proto/apibara/node/v1alpha1/Node'
import { ProtoGrpcType } from './proto/node'
import { StatusResponse__Output } from './proto/apibara/node/v1alpha1/StatusResponse'

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

  public streamMessages() {
    const s = this.client.streamMessages({})
    return new Promise((resolve, reject) => {
      s.on('data', console.log)
      s.on('end', () => resolve(undefined))
      s.on('error', (err) => reject(err))
      s.on('status', console.log)
    })
  }
}
