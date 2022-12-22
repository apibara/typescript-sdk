import { Message } from 'protobufjs'
import { Cursor, DataFinality, StreamDataRequest } from './proto'

/**
 * Start building a `StreamData` request.
 */
export function stream_data_request() {
  return new StreamDataRequestBuilder()
}

export class StreamDataRequestBuilder {
  private request: StreamDataRequest

  constructor() {
    this.request = {}
  }

  /**
   * Set the new stream id.
   */
  with_stream_id(streamId: number) {
    this.request.streamId = streamId
    return this
  }

  /**
   * Set the number of items in each response batch.
   */
  with_batch_size(size: number) {
    this.request.batchSize = size
    return this
  }

  /**
   * Set the cursor from where to resume streaming.
   */
  with_starting_cursor(cursor: Cursor) {
    this.request.startingCursor = cursor
    return this
  }

  /**
   * Set the request finality for data.
   */
  with_finality(finality: DataFinality) {
    this.request.finality = finality
    return this
  }

  /**
   * Set the stream-specific filter.
   */
  with_filter<T extends Message>(filter: Message<T>) {
    this.request.filter = filter.$type.encode(filter).finish()
    return this
  }

  /**
   * Build and return the request.
   */
  build() {
    return this.request
  }
}
