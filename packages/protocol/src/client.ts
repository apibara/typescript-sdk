import { ChannelCredentials, ClientDuplexStream, StatusObject } from '@grpc/grpc-js'
import { v1alpha2 } from './proto'
import { StreamDataRequest } from './request'

export { ChannelCredentials, StatusObject } from '@grpc/grpc-js'

const StreamService = v1alpha2.protoDescriptor.apibara.node.v1alpha2.Stream

export type DataStream = ClientDuplexStream<
  v1alpha2.IStreamDataRequest,
  v1alpha2.IStreamDataResponse
>

export type ConfigureArgs = {
  filter: Uint8Array
  batchSize?: number
  cursor?: v1alpha2.ICursor | null
  finality?: v1alpha2.DataFinality | null
}

export type OnReconnectResult = {
  reconnect: boolean
  args?: ConfigureArgs
}

export type OnReconnect = (
  err: StatusObject,
  retryCount: number
) => Promise<OnReconnectResult> | OnReconnectResult

export type StreamClientArgs = {
  url: string
  credentials?: ChannelCredentials
  onReconnect?: OnReconnect
}

export class StreamClient {
  private readonly inner: v1alpha2.StreamClient

  private stream?: DataStream
  private stream_id: number
  private onReconnect: OnReconnect
  private configuration?: ConfigureArgs

  constructor({ url, credentials, onReconnect }: StreamClientArgs) {
    this.inner = new StreamService(url, credentials ?? ChannelCredentials.createSsl(), {
      'grpc.keepalive_timeout_ms': 3_600_000,
    })
    this.stream_id = 0
    this.onReconnect = onReconnect ?? defaultOnReconnect
  }

  /**
   * Async iterator over messages in the stream.
   */
  async *[Symbol.asyncIterator](): AsyncIterator<v1alpha2.IStreamDataResponse> {
    if (!this.configuration) {
      throw new Error('StreamClient must be configured')
    }

    // connect if not connected.
    if (!this.stream) {
      this.connect()
      this._configure(this.configuration)
    }

    while (true) {
      let retryCount = 1
      let cursor = null
      try {
        // this check is to make ts happy
        if (!this.stream) {
          throw new Error('Stream disconnected unexpectedly')
        }

        for await (const message of this.stream) {
          const messageTyped = message as v1alpha2.IStreamDataResponse

          // only return messages if they are with the most recently configured stream
          if (messageTyped.streamId?.toString() == this.stream_id.toString()) {
            // reset retry count on new message
            retryCount = 1

            // keep cursor updated for use when reconnecting
            if (messageTyped.data) {
              cursor = messageTyped.data.cursor
            } else if (messageTyped.invalidate) {
              cursor = messageTyped.invalidate.cursor
            }

            yield messageTyped
          }
        }
      } catch (err: any) {
        const isGrpcError =
          err.hasOwnProperty('code') &&
          err.hasOwnProperty('details') &&
          err.hasOwnProperty('metadata')

        // non-grpc error, so just bubble it up
        if (!isGrpcError) {
          throw err
        }

        const { reconnect, args } = await Promise.resolve(this.onReconnect(err, retryCount))
        retryCount += 1
        if (!reconnect) {
          break
        }

        this.connect()

        if (args) {
          this._configure(args)
        } else {
          // use same configuration specified by user, restarting from the
          // latest ingested batch.
          const configuration = {
            ...this.configuration,
            cursor: cursor ?? this.configuration.cursor,
          }
          this._configure(configuration)
        }
      }
    }
  }

  /**
   * Configure the stream to return the requested data.
   *
   * The stream can be reconfigured while streaming data, the client will
   * take care of returning only data for the new configuration even if there
   * are old messages in-flight.
   */
  configure(args: ConfigureArgs) {
    this.configuration = args
    this._configure(args)
  }

  private _configure(args: ConfigureArgs) {
    const { filter, batchSize, cursor, finality } = args
    this.stream_id++

    // only send configuration if connected
    if (this.stream) {
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
  }

  private connect() {
    this.stream = this.inner.streamData()
    return this
  }
}

/**
 * A `onReconnect` callback that never reconnects.
 */
export function neverReconnect(_err: StatusObject, _retryCount: number): OnReconnectResult {
  return {
    reconnect: false,
  }
}

/**
 * A `onReconnect` callback that retries to reconnect up to 5 times.
 *
 * If the error is not an internal error, then it will not reconnect.
 * This callback awaits for `1s * retryCount` before returning.
 */
export async function defaultOnReconnect(
  err: StatusObject,
  retryCount: number
): Promise<OnReconnectResult> {
  if (err.code != 13) {
    return {
      reconnect: false,
    }
  }

  await new Promise((resolve) => setTimeout(resolve, retryCount * 1000))
  return {
    reconnect: retryCount < 5,
  }
}
