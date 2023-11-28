import { Contract } from './parser';
import { beforeEach, describe, expect, it } from "vitest"

describe('Contract class tests', () => {
  const mockAbi = [
    { name: 'event1', otherProps: '...' },
    { name: 'event2', otherProps: '...' },
    // Add more mock events as necessary
  ];

  const mockAddress = '0x123'; // Replace with a valid mock address if necessary

  let contract: Contract;

  beforeEach(() => {
    // Instantiate the Contract before each test with mocked ABI and address
    contract = new Contract(mockAddress, mockAbi);
  });

  describe('eventFilter method', () => {
    it('should return the correct event from the ABI', () => {
      const eventName = 'event1';
      const event = contract.eventFilter(eventName);
      expect(event).toEqual(mockAbi.find(item => item.name === eventName));
    });

    it('should throw an error if the event is not found in the ABI', () => {
      const invalidEventName = 'nonExistentEvent';
      expect(() => contract.eventFilter(invalidEventName)).toThrow(`Event ${invalidEventName} not found in contract ABI`);
    });
  });

  // describe('eventParser method', () => {
  //   it('should return a function that correctly parses an event and its transaction', () => {
  //     const eventName = 'event1';
  //     const mockEvent = { name: 'event1', data: 'some data' }; // Mock event object
  //     const mockTransaction = { id: 'tx123', data: 'transaction data' }; // Mock transaction object

  //     const parseFunction = contract.eventParser(eventName);
  //     const result = parseFunction({ event: mockEvent, transaction: mockTransaction });

  //     expect(result).toEqual({
  //       event: mockAbi.find(item => item.name === eventName),
  //       transaction: mockTransaction
  //     });
  //   });
  // });
});