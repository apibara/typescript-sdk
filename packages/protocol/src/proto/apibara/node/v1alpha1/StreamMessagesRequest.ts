// Original file: src/proto/node.proto

import type { Long } from '@grpc/proto-loader'

export interface StreamMessagesRequest {
  startingSequence?: number | string | Long
  pendingBlockIntervalSeconds?: number
}

export interface StreamMessagesRequest__Output {
  startingSequence: string
  pendingBlockIntervalSeconds: number
}
