// Original file: src/proto/node.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { StatusRequest as _apibara_node_v1alpha1_StatusRequest, StatusRequest__Output as _apibara_node_v1alpha1_StatusRequest__Output } from '../../../apibara/node/v1alpha1/StatusRequest';
import type { StatusResponse as _apibara_node_v1alpha1_StatusResponse, StatusResponse__Output as _apibara_node_v1alpha1_StatusResponse__Output } from '../../../apibara/node/v1alpha1/StatusResponse';
import type { StreamMessagesRequest as _apibara_node_v1alpha1_StreamMessagesRequest, StreamMessagesRequest__Output as _apibara_node_v1alpha1_StreamMessagesRequest__Output } from '../../../apibara/node/v1alpha1/StreamMessagesRequest';
import type { StreamMessagesResponse as _apibara_node_v1alpha1_StreamMessagesResponse, StreamMessagesResponse__Output as _apibara_node_v1alpha1_StreamMessagesResponse__Output } from '../../../apibara/node/v1alpha1/StreamMessagesResponse';

export interface NodeClient extends grpc.Client {
  Status(argument: _apibara_node_v1alpha1_StatusRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_apibara_node_v1alpha1_StatusResponse__Output>): grpc.ClientUnaryCall;
  Status(argument: _apibara_node_v1alpha1_StatusRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_apibara_node_v1alpha1_StatusResponse__Output>): grpc.ClientUnaryCall;
  Status(argument: _apibara_node_v1alpha1_StatusRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_apibara_node_v1alpha1_StatusResponse__Output>): grpc.ClientUnaryCall;
  Status(argument: _apibara_node_v1alpha1_StatusRequest, callback: grpc.requestCallback<_apibara_node_v1alpha1_StatusResponse__Output>): grpc.ClientUnaryCall;
  status(argument: _apibara_node_v1alpha1_StatusRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_apibara_node_v1alpha1_StatusResponse__Output>): grpc.ClientUnaryCall;
  status(argument: _apibara_node_v1alpha1_StatusRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_apibara_node_v1alpha1_StatusResponse__Output>): grpc.ClientUnaryCall;
  status(argument: _apibara_node_v1alpha1_StatusRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_apibara_node_v1alpha1_StatusResponse__Output>): grpc.ClientUnaryCall;
  status(argument: _apibara_node_v1alpha1_StatusRequest, callback: grpc.requestCallback<_apibara_node_v1alpha1_StatusResponse__Output>): grpc.ClientUnaryCall;
  
  StreamMessages(argument: _apibara_node_v1alpha1_StreamMessagesRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_apibara_node_v1alpha1_StreamMessagesResponse__Output>;
  StreamMessages(argument: _apibara_node_v1alpha1_StreamMessagesRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_apibara_node_v1alpha1_StreamMessagesResponse__Output>;
  streamMessages(argument: _apibara_node_v1alpha1_StreamMessagesRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_apibara_node_v1alpha1_StreamMessagesResponse__Output>;
  streamMessages(argument: _apibara_node_v1alpha1_StreamMessagesRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_apibara_node_v1alpha1_StreamMessagesResponse__Output>;
  
}

export interface NodeHandlers extends grpc.UntypedServiceImplementation {
  Status: grpc.handleUnaryCall<_apibara_node_v1alpha1_StatusRequest__Output, _apibara_node_v1alpha1_StatusResponse>;
  
  StreamMessages: grpc.handleServerStreamingCall<_apibara_node_v1alpha1_StreamMessagesRequest__Output, _apibara_node_v1alpha1_StreamMessagesResponse>;
  
}

export interface NodeDefinition extends grpc.ServiceDefinition {
  Status: MethodDefinition<_apibara_node_v1alpha1_StatusRequest, _apibara_node_v1alpha1_StatusResponse, _apibara_node_v1alpha1_StatusRequest__Output, _apibara_node_v1alpha1_StatusResponse__Output>
  StreamMessages: MethodDefinition<_apibara_node_v1alpha1_StreamMessagesRequest, _apibara_node_v1alpha1_StreamMessagesResponse, _apibara_node_v1alpha1_StreamMessagesRequest__Output, _apibara_node_v1alpha1_StreamMessagesResponse__Output>
}
