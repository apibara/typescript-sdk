import { Filter } from './filter'
import { FieldElement } from './felt'

describe('Filter', () => {
  describe('addHeader', () => {
    it('sets the header field', () => {
      let filter = Filter.create().withHeader().toObject()

      expect(filter.header).toEqual({})
    })
  })

  describe('addTransaction', () => {
    it('accepts a builder or callback function', () => {
      let filter = Filter.create()
        .addTransaction(Filter.transaction().declare().withClassHash(FieldElement.fromBigInt(123)))
        .addTransaction((tx) =>
          tx.deployAccount().withConstructorCalldata([FieldElement.fromBigInt(0)])
        )
        .toObject()

      expect(filter.transactions).toHaveLength(2)
      expect(filter.transactions?.[0].declare).toBeDefined()
      expect(filter.transactions?.[1].deployAccount).toBeDefined()
    })
  })

  describe('addEvent', () => {
    it('accepts a builder or callback function', () => {
      let filter = Filter.create()
        .addEvent(Filter.event().withFromAddress(FieldElement.fromBigInt('0x0')))
        .addEvent((ev) => ev.withData([FieldElement.fromBigInt(0)]))
        .toObject()

      expect(filter.events).toHaveLength(2)
    })
  })

  describe('addMessage', () => {
    it('accepts a builder or callback function', () => {
      let filter = Filter.create()
        .addMessage(Filter.message().withToAddress(FieldElement.fromBigInt(0)))
        .addMessage((msg) => msg.withPayload([FieldElement.fromBigInt(0)]))
        .toObject()

      expect(filter.messages).toHaveLength(2)
    })
  })

  describe('addStateUpdate', () => {
    it('accepts a callback function', () => {
      let filter = Filter.create()
        .withStateUpdate((s) => s)
        .toObject()
      expect(filter.stateUpdate).toBeDefined()
    })

    it('accepts a builder', () => {
      let filter = Filter.create().withStateUpdate(Filter.stateUpdate()).toObject()
      expect(filter.stateUpdate).toBeDefined()
    })
  })
})
