import { ChannelCredentials, ClientDuplexStream } from '@grpc/grpc-js'
import { v1alpha2 } from './proto'
import { StreamDataRequest } from './request'

export { ChannelCredentials } from '@grpc/grpc-js'

export type ErrorHandler = (client: StreamClient, err: Error) => void | Promise<void>
export type CloseHandler = (client: StreamClient) => void | Promise<void>
export type DataHandler = (client: StreamClient, data: v1alpha2.IData) => void | Promise<void>
export type InvalidateHandler = (
  client: StreamClient,
  invalidate: v1alpha2.IInvalidate
) => void | Promise<void>
export type HeartbeatHandler = (
  client: StreamClient,
  invalidate: v1alpha2.IHeartbeat
) => void | Promise<void>

const StreamService = v1alpha2.protoDescriptor.apibara.node.v1alpha2.Stream

export type DataStream = ClientDuplexStream<
  v1alpha2.IStreamDataRequest,
  v1alpha2.IStreamDataResponse
>

export class StreamClient {
  private readonly inner: v1alpha2.StreamClient

  private stream?: DataStream
  private configured: boolean
  private stream_id: number

  constructor({ url, credentials }: { url: string; credentials?: ChannelCredentials }) {
    this.inner = new StreamService(url, credentials ?? ChannelCredentials.createSsl(), {
      'grpc.keepalive_timeout_ms': 3_600_000,
    })
    this.configured = false
    this.stream_id = 0
  }

  connect() {
    this.stream = this.inner.streamData()
    return this
  }

  async *[Symbol.asyncIterator](): AsyncIterator<v1alpha2.IStreamDataResponse> {
    this.ensureConnected()
    this.ensureConfigured()

    if (this.stream) {
      for await (const message of this.stream) {
        const messageTyped = message as v1alpha2.IStreamDataResponse
        // only return messages if they are with the most recently configured stream
        if (messageTyped.streamId?.toString() == this.stream_id.toString()) {
          yield messageTyped
        }
      }
    }
  }

  configure({
    filter,
    batchSize,
    cursor,
    finality,
  }: {
    filter: Uint8Array
    batchSize?: number
    cursor?: v1alpha2.ICursor | null
    finality?: v1alpha2.DataFinality | null
  }) {
    this.ensureConnected()
    this.configured = true

    this.stream_id++

    const builder = StreamDataRequest.create().withStreamId(this.stream_id).withFilter(filter)

    if (batchSize) {
      builder.withBatchSize(batchSize)
    }
    if (cursor) {
      builder.withStartingCursor(cursor)
    }
    if (finality) {
      builder.withFinality(finality)
    }

    const request = builder.encode()
    this.stream?.write(request)
  }

  private ensureConnected() {
    if (!this.stream) {
      throw new Error('StreamClient is not connected')
    }
  }

  private ensureConfigured() {
    if (!this.configured) {
      throw new Error('StreamClient must be configured')
    }
  }
}
