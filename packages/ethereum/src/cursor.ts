import Long from 'long'
import { H256 } from './hash'
import { v1alpha2 } from './proto'

export const EthereumCursor = {
  /**
   * Creates a cursor pointing at the canonical block at the given height.
   */
  createWithBlockNumber: (number: string | number | Long) => {
    return {
      orderKey: Long.fromValue(number),
      uniqueKey: new Uint8Array(),
    }
  },

  /**
   * Creates a cursor pointing at the block with the given height and hash.
   */
  createWithBlockNumberAndHash: (number: string | number | Long, hash: v1alpha2.H256) => {
    const uniqueKey = Buffer.from(H256.toHex(hash).replace('0x', ''), 'hex')
    return {
      orderKey: Long.fromValue(number),
      uniqueKey,
    }
  },
}
