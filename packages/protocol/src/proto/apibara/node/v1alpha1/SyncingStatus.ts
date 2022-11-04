// Original file: src/proto/node.proto

import type { InputSyncingStatus as _apibara_node_v1alpha1_InputSyncingStatus, InputSyncingStatus__Output as _apibara_node_v1alpha1_InputSyncingStatus__Output } from '../../../apibara/node/v1alpha1/InputSyncingStatus';
import type { Long } from '@grpc/proto-loader';

export interface SyncingStatus {
  'sequence'?: (number | string | Long);
  'inputs'?: (_apibara_node_v1alpha1_InputSyncingStatus)[];
}

export interface SyncingStatus__Output {
  'sequence': (string);
  'inputs': (_apibara_node_v1alpha1_InputSyncingStatus__Output)[];
}
