import { Contract } from './parser';
import { describe, expect, it } from "vitest"
import { FieldElement } from "./felt";
import { EventAbi } from "starknet";

describe('Contract class tests', () => {
  const mockContractAddress: FieldElement = '0x0';
  const mockEventAbi: EventAbi = {
    type: 'event',
    name: 'MockEvent',
    kind: 'struct',
    members: [{ name: 'param1', type: 'felt', kind: 'key' }],
  };

  const mockContractAbi = [mockEventAbi];

  it('should create an EventFilter for a valid event name', () => {
    const contract = new Contract(mockContractAddress, mockContractAbi);
    const filter = contract.eventFilter('MockEvent');

    expect(filter).toBeDefined();
    expect(filter.fromAddress).toBe(mockContractAddress);
    // Further assertions can be made based on the expected structure of EventFilter
  });

  it('should throw an error for an invalid event name', () => {
    const contract = new Contract(mockContractAddress, mockContractAbi);

    expect(() => {
      contract.eventFilter('InvalidEvent');
    }).toThrow('Event InvalidEvent not found in contract ABI');
  });

});