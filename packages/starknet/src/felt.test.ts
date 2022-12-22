import { FieldElement } from './felt'

describe('FieldElement', () => {
  describe('encoding', () => {
    it('can be encoded to and from the wire format', () => {
      const original = BigInt('0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3')

      const encoded = FieldElement.fromBigInt(original)

      const back = FieldElement.toBigInt(encoded)

      expect(back).toBe(original)
    })
  })
})
