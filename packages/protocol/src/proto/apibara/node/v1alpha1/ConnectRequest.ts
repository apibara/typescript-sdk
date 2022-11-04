// Original file: src/proto/node.proto

import type { Long } from '@grpc/proto-loader'

export interface ConnectRequest {
  startingSequence?: number | string | Long
}

export interface ConnectRequest__Output {
  startingSequence: string
}
