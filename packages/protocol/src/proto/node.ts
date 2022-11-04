import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { NodeClient as _apibara_node_v1alpha1_NodeClient, NodeDefinition as _apibara_node_v1alpha1_NodeDefinition } from './apibara/node/v1alpha1/Node';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  apibara: {
    node: {
      v1alpha1: {
        ConnectRequest: MessageTypeDefinition
        ConnectResponse: MessageTypeDefinition
        Data: MessageTypeDefinition
        Heartbeat: MessageTypeDefinition
        InputSyncingStatus: MessageTypeDefinition
        Invalidate: MessageTypeDefinition
        Node: SubtypeConstructor<typeof grpc.Client, _apibara_node_v1alpha1_NodeClient> & { service: _apibara_node_v1alpha1_NodeDefinition }
        NotStartedStatus: MessageTypeDefinition
        StatusRequest: MessageTypeDefinition
        StatusResponse: MessageTypeDefinition
        StreamMessagesRequest: MessageTypeDefinition
        StreamMessagesResponse: MessageTypeDefinition
        SyncedStatus: MessageTypeDefinition
        SyncingStatus: MessageTypeDefinition
      }
    }
  }
  google: {
    protobuf: {
      Any: MessageTypeDefinition
    }
  }
}

