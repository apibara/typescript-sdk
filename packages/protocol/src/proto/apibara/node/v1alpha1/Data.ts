// Original file: src/proto/node.proto

import type {
  Any as _google_protobuf_Any,
  Any__Output as _google_protobuf_Any__Output,
} from '../../../google/protobuf/Any'
import type { Long } from '@grpc/proto-loader'

export interface Data {
  sequence?: number | string | Long
  data?: _google_protobuf_Any | null
}

export interface Data__Output {
  sequence: string
  data: _google_protobuf_Any__Output | null
}
