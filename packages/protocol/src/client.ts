import { ChannelCredentials, ClientDuplexStream } from '@grpc/grpc-js'
import { v1alpha2 } from './proto'

export { ChannelCredentials } from '@grpc/grpc-js'

const StreamService = v1alpha2.protoDescriptor.apibara.node.v1alpha2.Stream

export type DataStream = ClientDuplexStream<
  v1alpha2.IStreamDataRequest,
  v1alpha2.IStreamDataResponse
>

export class StreamClient {
  private readonly inner: v1alpha2.StreamClient

  constructor(address: string, credentials: ChannelCredentials) {
    this.inner = new StreamService(address, credentials)
  }

  connect(): DataStream {
    return this.inner.streamData()
  }
}
