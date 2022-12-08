import { Readable } from 'stream'
import { ClientReadableStream } from '@grpc/grpc-js'
import { NodeClient as GrpcNodeClient } from './proto/apibara/node/v1alpha1/Node'
import { StreamMessagesResponse__Output } from './proto/apibara/node/v1alpha1/StreamMessagesResponse'
import { StreamMessagesRequest } from './proto/apibara/node/v1alpha1/StreamMessagesRequest'

const defaultMaxRetry = 3
const defaultDelaySeconds = 5

export function neverRetry(_retryCount: number): Retry {
  return {
    retry: false,
  }
}

export function defaultOnRetry(retryCount: number): Retry {
  return {
    retry: retryCount < defaultMaxRetry,
    delay: defaultDelaySeconds,
  }
}

export interface Retry {
  retry: boolean
  startingSequence?: number
  delay?: number
}

export class StreamMessagesStream extends Readable {
  private readonly client: GrpcNodeClient
  private readonly initialRequest: StreamMessagesRequest
  private readonly onRetry: (retryCount: number) => Retry
  private source?: ClientReadableStream<StreamMessagesResponse__Output>
  private currentSequence?: number
  private retryCount: number

  constructor({
    args,
    onRetry,
    client,
  }: {
    args: StreamMessagesRequest
    onRetry: (retryCount: number) => Retry
    client: GrpcNodeClient
  }) {
    super({ objectMode: true })
    this.initialRequest = args
    this.client = client
    this.onRetry = onRetry
    this.retryCount = 0
  }

  _construct(callback: (error?: Error | null | undefined) => void): void {
    this.setupSource()
    callback()
  }

  _read(_size: number): void {
    if (this.source) {
      // resume source data if not flowing
      if (!this.source.readableFlowing) {
        this.source.resume()
      }
    } else {
      // create source stream
      this.setupSource(this.currentSequence)
    }
  }

  setupSource(startingSequence?: number) {
    const request =
      startingSequence !== undefined
        ? { ...this.initialRequest, startingSequence }
        : this.initialRequest
    this.source = this.client.streamMessages(request)

    this.source.on('data', this.onData.bind(this))
    this.source.once('error', this.onError.bind(this))
    this.source.once('end', this.onEnd.bind(this))
  }

  cleanupSource() {
    if (!this.source) {
      return
    }

    this.source.off('data', this.onData.bind(this))
    this.source.off('error', this.onData.bind(this))
    this.source.off('end', this.onEnd.bind(this))
  }

  onData(chunk: StreamMessagesResponse__Output) {
    // reset retry count
    this.retryCount = 0
    if (chunk.data) {
      this.currentSequence = +chunk.data.sequence
    } else if (chunk.invalidate) {
      this.currentSequence = +chunk.invalidate
    }

    // apply backpressure on stream
    if (!this.push(chunk)) {
      this.source?.pause()
    }
  }

  onError(_err: any) {
    this.cleanupSource()
    this.retryCount += 1

    const { retry, delay, startingSequence } = this.onRetry(this.retryCount)
    if (retry) {
      const intervalDelayMs = (delay ?? defaultDelaySeconds) * 1000
      setTimeout(() => {
        this.setupSource(startingSequence)
      }, intervalDelayMs)
    }
  }

  onEnd() {
    // block streams never end
    if (this.retryCount > 0) {
      return
    }
    this.cleanupSource()
  }
}
