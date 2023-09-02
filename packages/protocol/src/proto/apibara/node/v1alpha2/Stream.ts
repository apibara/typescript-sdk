// Original file: src/proto/stream.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { StreamDataRequest as _apibara_node_v1alpha2_StreamDataRequest, StreamDataRequest__Output as _apibara_node_v1alpha2_StreamDataRequest__Output } from '../../../apibara/node/v1alpha2/StreamDataRequest';
import type { StreamDataResponse as _apibara_node_v1alpha2_StreamDataResponse, StreamDataResponse__Output as _apibara_node_v1alpha2_StreamDataResponse__Output } from '../../../apibara/node/v1alpha2/StreamDataResponse';

export interface StreamClient extends grpc.Client {
  StreamData(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_apibara_node_v1alpha2_StreamDataRequest, _apibara_node_v1alpha2_StreamDataResponse__Output>;
  StreamData(options?: grpc.CallOptions): grpc.ClientDuplexStream<_apibara_node_v1alpha2_StreamDataRequest, _apibara_node_v1alpha2_StreamDataResponse__Output>;
  streamData(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_apibara_node_v1alpha2_StreamDataRequest, _apibara_node_v1alpha2_StreamDataResponse__Output>;
  streamData(options?: grpc.CallOptions): grpc.ClientDuplexStream<_apibara_node_v1alpha2_StreamDataRequest, _apibara_node_v1alpha2_StreamDataResponse__Output>;
  
}

export interface StreamHandlers extends grpc.UntypedServiceImplementation {
  StreamData: grpc.handleBidiStreamingCall<_apibara_node_v1alpha2_StreamDataRequest__Output, _apibara_node_v1alpha2_StreamDataResponse>;
  
}

export interface StreamDefinition extends grpc.ServiceDefinition {
  StreamData: MethodDefinition<_apibara_node_v1alpha2_StreamDataRequest, _apibara_node_v1alpha2_StreamDataResponse, _apibara_node_v1alpha2_StreamDataRequest__Output, _apibara_node_v1alpha2_StreamDataResponse__Output>
}
