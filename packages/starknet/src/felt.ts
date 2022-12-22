import Long from 'long'
import { FieldElement as FE } from './proto/types'

const MAX_FELT = 2n ** 251n + 17n * 2n ** 192n

export const FieldElement = {
  encode: FE.encode,
  decode: FE.decode,
  fromJSON: FE.fromJSON,
  toJSON: FE.toJSON,
  fromPartial: FE.fromPartial,

  /**
   * Converts from the wire representation to a bigint.
   */
  toBigInt(message: FE): bigint {
    const loLo = message.loLo.toString(16).padStart(16, '0')
    const loHi = message.loHi.toString(16).padStart(16, '0')
    const hiLo = message.hiLo.toString(16).padStart(16, '0')
    const hiHi = message.hiHi.toString(16).padStart(16, '0')
    return BigInt(`0x${hiHi}${hiLo}${loHi}${loLo}`)
  },

  /**
   * Returns the wire representation of the given bigint.
   */
  fromBigInt(number: bigint): FE {
    if (number < 0 || number > MAX_FELT) {
      throw new Error('FieldElement outside of range')
    }

    // bit-shifting of a big int doesn't make much sense.
    // convert to hex and from there breakup in pieces
    const hex = number.toString(16).padStart(64, '0')
    const s = hex.length
    const loLo = Long.fromString(hex.slice(s - 16, s), true, 16)
    const loHi = Long.fromString(hex.slice(s - 32, s - 16), true, 16)
    const hiLo = Long.fromString(hex.slice(s - 48, s - 32), true, 16)
    const hiHi = Long.fromString(hex.slice(s - 64, s - 48), true, 16)

    return {
      loLo,
      loHi,
      hiLo,
      hiHi,
    }
  },
}
