import { promisify } from 'util'
import { Readable } from 'stream'
import {
  loadPackageDefinition,
  credentials as grpcCredentials,
  ClientOptions,
  ChannelCredentials,
  ClientReadableStream,
} from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'
import { NodeClient as GrpcNodeClient } from './proto/apibara/node/v1alpha1/Node'
import { ProtoGrpcType } from './proto/node'
import { StatusResponse__Output } from './proto/apibara/node/v1alpha1/StatusResponse'
import { StreamMessagesResponse__Output } from './proto/apibara/node/v1alpha1/StreamMessagesResponse'
import { StreamMessagesRequest } from './proto/apibara/node/v1alpha1/StreamMessagesRequest'

const __NODE_PROTO_PATH = __dirname + '/proto/node.proto'

const packageDefinition = loadSync(__NODE_PROTO_PATH, {})
const protoDescriptor = loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType

const defaultMaxRetry = 3
const defaultDelaySeconds = 5

export const Node = protoDescriptor.apibara.node.v1alpha1.Node

export const credentials = grpcCredentials

export interface Retry {
  retry: boolean
  startingSequence?: number
  delay?: number
}

export interface StreamMessagesOptions {
  reconnect?: boolean
  onRetry?: (retryCount: number) => Retry
}

export class NodeClient {
  private readonly client: GrpcNodeClient

  constructor(address: string, credentials: ChannelCredentials, options?: ClientOptions) {
    this.client = new Node(address, credentials, options)
  }

  public async status(): Promise<StatusResponse__Output | undefined> {
    return promisify(this.client.Status.bind(this.client, {}))()
  }

  public streamMessages(
    args: StreamMessagesRequest,
    options?: StreamMessagesOptions
  ): StreamMessagesStream {
    // only reconnect if user has opted-in
    let onRetry = neverRetry
    if (options?.reconnect) {
      if (options.onRetry) {
        onRetry = options.onRetry
      } else {
        onRetry = defaultOnRetry
      }
    }

    return new StreamMessagesStream({ args, onRetry, client: this.client })
  }
}

function neverRetry(_retryCount: number): Retry {
  return {
    retry: false,
  }
}

function defaultOnRetry(retryCount: number): Retry {
  return {
    retry: retryCount < defaultMaxRetry,
    delay: defaultDelaySeconds,
  }
}

class StreamMessagesStream extends Readable {
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
