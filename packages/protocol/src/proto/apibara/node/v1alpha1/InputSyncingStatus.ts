// Original file: src/proto/node.proto

import type { Long } from '@grpc/proto-loader';

export interface InputSyncingStatus {
  'head'?: (number | string | Long);
  'indexed'?: (number | string | Long);
}

export interface InputSyncingStatus__Output {
  'head': (string);
  'indexed': (string);
}
