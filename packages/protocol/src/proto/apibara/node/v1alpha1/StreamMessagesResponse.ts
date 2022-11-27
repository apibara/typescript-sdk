// Original file: src/proto/node.proto

import type {
  Invalidate as _apibara_node_v1alpha1_Invalidate,
  Invalidate__Output as _apibara_node_v1alpha1_Invalidate__Output,
} from '../../../apibara/node/v1alpha1/Invalidate'
import type {
  Data as _apibara_node_v1alpha1_Data,
  Data__Output as _apibara_node_v1alpha1_Data__Output,
} from '../../../apibara/node/v1alpha1/Data'
import type {
  Heartbeat as _apibara_node_v1alpha1_Heartbeat,
  Heartbeat__Output as _apibara_node_v1alpha1_Heartbeat__Output,
} from '../../../apibara/node/v1alpha1/Heartbeat'

export interface StreamMessagesResponse {
  invalidate?: _apibara_node_v1alpha1_Invalidate | null
  data?: _apibara_node_v1alpha1_Data | null
  heartbeat?: _apibara_node_v1alpha1_Heartbeat | null
  pending?: _apibara_node_v1alpha1_Data | null
  message?: 'invalidate' | 'data' | 'heartbeat' | 'pending'
}

export interface StreamMessagesResponse__Output {
  invalidate?: _apibara_node_v1alpha1_Invalidate__Output | null
  data?: _apibara_node_v1alpha1_Data__Output | null
  heartbeat?: _apibara_node_v1alpha1_Heartbeat__Output | null
  pending?: _apibara_node_v1alpha1_Data__Output | null
  message: 'invalidate' | 'data' | 'heartbeat' | 'pending'
}
