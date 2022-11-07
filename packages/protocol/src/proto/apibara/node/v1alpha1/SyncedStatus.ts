// Original file: src/proto/node.proto

import type { Long } from '@grpc/proto-loader'

export interface SyncedStatus {
  sequence?: number | string | Long
}

export interface SyncedStatus__Output {
  sequence: string
}
