import { loadPackageDefinition } from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'
import { ProtoGrpcType } from './stream'

const __NODE_PROTO_PATH = __dirname + '/stream.proto'

// export definitions
export const packageDefinition = loadSync(__NODE_PROTO_PATH, {})
export const protoDescriptor = loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType

// re-export all types
export * from './apibara/node/v1alpha2/Cursor'
export * from './apibara/node/v1alpha2/Data'
export * from './apibara/node/v1alpha2/DataFinality'
export * from './apibara/node/v1alpha2/Heartbeat'
export * from './apibara/node/v1alpha2/Invalidate'
export * from './apibara/node/v1alpha2/Stream'
export * from './apibara/node/v1alpha2/StreamDataRequest'
export * from './apibara/node/v1alpha2/StreamDataResponse'
