import Long from 'long'
import { ICursor } from './proto/v1alpha2'

export const Cursor = {
  /**
   * Creates a new cursor with only the `orderKey` set.
   *
   * Notice that this cursor does not uniquely identify a message in the stream
   * and may result in missing information.
   */
  createWithOrderKey: (order: string | number | Long): ICursor => {
    return {
      orderKey: Long.fromValue(order),
      uniqueKey: new Uint8Array(),
    }
  },

  /**
   * Creates a new cursor with both order and unique keys.
   *
   * This cursor uniquely identifies a message in the stream, even if it has
   * been invalidated.
   */
  create: (order: string | number | Long, unique: Uint8Array): ICursor => {
    return {
      orderKey: Long.fromValue(order),
      uniqueKey: unique,
    }
  },

  /**
   * Returns the cursor string representation.
   */
  toString: (cursor?: ICursor | null): string | undefined => {
    if (!cursor) return
    let hash = Buffer.from(cursor.uniqueKey).toString('hex')
    return `${cursor.orderKey.toString()}/0x${hash}`
  },
}
