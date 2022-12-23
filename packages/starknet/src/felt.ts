import Long from 'long'
import { apibara } from './proto/generated'

const MAX_FELT = 2n ** 251n + 17n * 2n ** 192n

export const FieldElement = {
  encode: apibara.starknet.v1alpha2.FieldElement.encode,
  decode: apibara.starknet.v1alpha2.FieldElement.decode,
  fromObject: apibara.starknet.v1alpha2.FieldElement.fromObject,
  toObject: apibara.starknet.v1alpha2.FieldElement.toObject,

  /**
   * Converts from the wire representation to a bigint.
   */
  toBigInt(message: apibara.starknet.v1alpha2.IFieldElement): bigint {
    const loLo = hexEncodedU64(message.loLo)
    const loHi = hexEncodedU64(message.loHi)
    const hiLo = hexEncodedU64(message.hiLo)
    const hiHi = hexEncodedU64(message.hiHi)
    return BigInt(`0x${hiHi}${hiLo}${loHi}${loLo}`)
  },

  /**
   * Returns the wire representation of the given bigint.
   */
  fromBigInt(number: string | number | bigint): apibara.starknet.v1alpha2.IFieldElement {
    if (number < 0 || number > MAX_FELT) {
      throw new Error('FieldElement outside of range')
    }

    const bn = BigInt(number)
    // bit-shifting of a big int doesn't make much sense.
    // convert to hex and from there breakup in pieces
    const hex = bn.toString(16).padStart(64, '0')
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

function hexEncodedU64(n: Long | number | null | undefined): string {
  const s = n?.toString(16) ?? ''
  return s.padStart(16, '0')
}
