// Original file: src/proto/node.proto

import type { SyncingStatus as _apibara_node_v1alpha1_SyncingStatus, SyncingStatus__Output as _apibara_node_v1alpha1_SyncingStatus__Output } from '../../../apibara/node/v1alpha1/SyncingStatus';
import type { SyncedStatus as _apibara_node_v1alpha1_SyncedStatus, SyncedStatus__Output as _apibara_node_v1alpha1_SyncedStatus__Output } from '../../../apibara/node/v1alpha1/SyncedStatus';
import type { NotStartedStatus as _apibara_node_v1alpha1_NotStartedStatus, NotStartedStatus__Output as _apibara_node_v1alpha1_NotStartedStatus__Output } from '../../../apibara/node/v1alpha1/NotStartedStatus';

export interface StatusResponse {
  'syncing'?: (_apibara_node_v1alpha1_SyncingStatus | null);
  'synced'?: (_apibara_node_v1alpha1_SyncedStatus | null);
  'notStarted'?: (_apibara_node_v1alpha1_NotStartedStatus | null);
  'message'?: "syncing"|"synced"|"notStarted";
}

export interface StatusResponse__Output {
  'syncing'?: (_apibara_node_v1alpha1_SyncingStatus__Output | null);
  'synced'?: (_apibara_node_v1alpha1_SyncedStatus__Output | null);
  'notStarted'?: (_apibara_node_v1alpha1_NotStartedStatus__Output | null);
  'message': "syncing"|"synced"|"notStarted";
}
