import { ChannelCredentials, ClientDuplexStream } from '@grpc/grpc-js'
import * as proto from './proto'

const StreamService = proto.protoDescriptor.apibara.node.v1alpha2.Stream

export type DataStream = ClientDuplexStream<
  proto.StreamDataRequest,
  proto.StreamDataResponse__Output
>

export class StreamClient {
  private readonly inner: proto.StreamClient

  constructor(address: string, credentials: ChannelCredentials) {
    this.inner = new StreamService(address, credentials)
  }

  connect(): DataStream {
    return this.inner.streamData()
  }
}
