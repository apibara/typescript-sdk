// Original file: src/proto/node.proto

import type { Long } from '@grpc/proto-loader'

export interface StreamMessagesRequest {
  startingSequence?: number | string | Long
}

export interface StreamMessagesRequest__Output {
  startingSequence: string
}
