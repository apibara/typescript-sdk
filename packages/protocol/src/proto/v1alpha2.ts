import { loadPackageDefinition } from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'
import { ProtoGrpcType } from './stream'

const __NODE_PROTO_PATH = __dirname + '/stream.proto'

// export definitions
export const packageDefinition = loadSync(__NODE_PROTO_PATH, {})
export const protoDescriptor = loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType

// re-export all types, use same naming convention as protobufjs
export { Cursor as ICursor } from './apibara/node/v1alpha2/Cursor'
export { Data as IData } from './apibara/node/v1alpha2/Data'
export { DataFinality } from './apibara/node/v1alpha2/DataFinality'
export { Heartbeat as IHeartbeat } from './apibara/node/v1alpha2/Heartbeat'
export { Invalidate as IInvalidate } from './apibara/node/v1alpha2/Invalidate'
export { StreamClient } from './apibara/node/v1alpha2/Stream'
export { StreamDataRequest as IStreamDataRequest } from './apibara/node/v1alpha2/StreamDataRequest'
export { StreamDataResponse as IStreamDataResponse } from './apibara/node/v1alpha2/StreamDataResponse'
