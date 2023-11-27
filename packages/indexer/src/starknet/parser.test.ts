import { Contract } from './parser';
import { describe, expect, it } from "vitest"

describe('MyEventFilterParser', () => {
  it('should create an event filter', () => {
    const contract = new Contract('0x123', []);
    const filter = contract.eventFilter("CreateAccount");
    expect(filter).toEqual({ address: '0x123', abi: [] });
  });
});