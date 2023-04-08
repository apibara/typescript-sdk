import { H160, H256 } from './hash'

describe('H256', () => {
  describe('encoding', () => {
    it('can be encoded to and from the wire format', () => {
      const original = BigInt('0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3')

      const encoded = H256.fromBigInt(original)

      const back = H256.toBigInt(encoded)

      expect(back).toBe(original)
    })

    it('encodes the value as big endian', () => {
      const prime = 2n ** 251n + 17n * 2n ** 192n
      const encoded = H256.fromBigInt(prime)
      expect(encoded.hiHi?.toString()).toEqual('0')
      expect(encoded.hiLo?.toString()).toEqual('0')
      expect(encoded.loHi?.toString()).toEqual('0')
      expect(encoded.loLo?.toString()).toEqual('576460752303423505')
    })
  })
})

describe('H160', () => {
  describe('encoding', () => {
    it('can be encoded to and from the wire format', () => {
      const original = BigInt('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')

      const encoded = H160.fromBigInt(original)

      const back = H160.toBigInt(encoded)

      expect(back).toBe(original)
    })
  })
})
