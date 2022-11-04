// Original file: src/proto/node.proto

import type { Long } from '@grpc/proto-loader'

export interface Invalidate {
  sequence?: number | string | Long
}

export interface Invalidate__Output {
  sequence: string
}
