import { loadPackageDefinition } from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'
import { ProtoGrpcType } from './proto/node'

const __NODE_PROTO_PATH = __dirname + '/proto/node.proto'

const packageDefinition = loadSync(__NODE_PROTO_PATH, {})
const protoDescriptor = loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType

export const node = protoDescriptor.apibara.node
