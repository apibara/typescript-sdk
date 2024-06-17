import { describe, it, expect } from "vitest";
import { Schema } from "@effect/schema";

import { EventFilter, HeaderFilter, Key, TransactionFilter } from "./filter";

describe("HeaderFilter", () => {
  const encode = Schema.encodeSync(HeaderFilter);
  const decode = Schema.decodeSync(HeaderFilter);

  it("should encode and decode", () => {
    const always = { always: true };

    const proto = encode(always);
    const decoded = decode(proto);
    expect(decoded).toEqual(always);
  });
});

describe("Key", () => {
  const encode = Schema.encodeSync(Key);
  const decode = Schema.decodeSync(Key);

  it("should encode null values", () => {
    const proto = encode(null);
    expect(proto).toMatchInlineSnapshot(`
      {
        "value": undefined,
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toBe(null);
  });

  it("should encode field elements", () => {
    const proto = encode("0x1234");
    expect(proto).toMatchInlineSnapshot(`
      {
        "value": {
          "hiHi": 4660n,
          "hiLo": 0n,
          "loHi": 0n,
          "loLo": 0n,
        },
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(
      `"0x0000000000000000000000000000000000000000000000000000000000001234"`,
    );
  });
});

describe("EventFilter", () => {
  const encode = Schema.encodeSync(EventFilter);
  const decode = Schema.decodeSync(EventFilter);

  it("should encode and decode default values", () => {
    const proto = encode({});
    expect(proto).toMatchInlineSnapshot(`{}`);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`{}`);
  });

  it("should encode and decode all values", () => {
    const proto = encode({
      fromAddress: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      keys: [
        "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        null,
        null,
        "0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
      ],
      strict: true,
      includeReverted: true,
      includeTransaction: true,
      includeReceipt: true,
      includeMessages: true,
      includeSiblings: true,
    });
    expect(proto).toMatchInlineSnapshot(`
      {
        "fromAddress": {
          "hiHi": 12297829382473034410n,
          "hiLo": 12297829382473034410n,
          "loHi": 170n,
          "loLo": 0n,
        },
        "includeMessages": true,
        "includeReceipt": true,
        "includeReverted": true,
        "includeSiblings": true,
        "includeTransaction": true,
        "keys": [
          {
            "value": {
              "hiHi": 13527612320720337851n,
              "hiLo": 13527612320720337851n,
              "loHi": 187n,
              "loLo": 0n,
            },
          },
          {
            "value": undefined,
          },
          {
            "value": undefined,
          },
          {
            "value": {
              "hiHi": 14757395258967641292n,
              "hiLo": 14757395258967641292n,
              "loHi": 0n,
              "loLo": 0n,
            },
          },
        ],
        "strict": true,
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`
      {
        "fromAddress": "0x000000000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "includeMessages": true,
        "includeReceipt": true,
        "includeReverted": true,
        "includeSiblings": true,
        "includeTransaction": true,
        "keys": [
          "0x000000000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          null,
          null,
          "0x00000000000000000000000000000000cccccccccccccccccccccccccccccccc",
        ],
        "strict": true,
      }
    `);
  });
});

describe("TransactionFilter", () => {
  const encode = Schema.encodeSync(TransactionFilter);
  const decode = Schema.decodeSync(TransactionFilter);

  it("should encode and decode default values", () => {
    const proto = encode({});
    expect(proto).toMatchInlineSnapshot(`{}`);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`{}`);
  });

  it("should encode and decode extra fields", () => {
    const proto = encode({
      includeEvents: true,
      includeMessages: true,
      includeReceipt: true,
      includeReverted: true,
    });
    expect(proto).toMatchInlineSnapshot(`
      {
        "includeEvents": true,
        "includeMessages": true,
        "includeReceipt": true,
        "includeReverted": true,
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`
      {
        "includeEvents": true,
        "includeMessages": true,
        "includeReceipt": true,
        "includeReverted": true,
      }
    `);
  });

  it("should encode and decode invoke transaction v0", () => {
    const proto = encode({
      transactionType: {
        _tag: "invokeV0",
        invokeV0: {},
      },
    });
    expect(proto).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "$case": "invokeV0",
          "invokeV0": {},
        },
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "_tag": "invokeV0",
          "invokeV0": {},
        },
      }
    `);
  });

  it("should encode and decode invoke transaction v1", () => {
    const proto = encode({
      transactionType: {
        _tag: "invokeV1",
        invokeV1: {},
      },
    });
    expect(proto).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "$case": "invokeV1",
          "invokeV1": {},
        },
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "_tag": "invokeV1",
          "invokeV1": {},
        },
      }
    `);
  });

  it("should encode and decode invoke transaction v3", () => {
    const proto = encode({
      transactionType: {
        _tag: "invokeV3",
        invokeV3: {},
      },
    });
    expect(proto).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "$case": "invokeV3",
          "invokeV3": {},
        },
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "_tag": "invokeV3",
          "invokeV3": {},
        },
      }
    `);
  });

  it("should encode and decode deploy transaction", () => {
    const proto = encode({
      transactionType: {
        _tag: "deploy",
        deploy: {},
      },
    });
    expect(proto).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "$case": "deploy",
          "deploy": {},
        },
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "_tag": "deploy",
          "deploy": {},
        },
      }
    `);
  });

  it("should encode and decode declare transaction v0", () => {
    const proto = encode({
      transactionType: {
        _tag: "declareV0",
        declareV0: {},
      },
    });
    expect(proto).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "$case": "declareV0",
          "declareV0": {},
        },
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "_tag": "declareV0",
          "declareV0": {},
        },
      }
    `);
  });

  it("should encode and decode declare transaction v1", () => {
    const proto = encode({
      transactionType: {
        _tag: "declareV1",
        declareV1: {},
      },
    });
    expect(proto).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "$case": "declareV1",
          "declareV1": {},
        },
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "_tag": "declareV1",
          "declareV1": {},
        },
      }
    `);
  });

  it("should encode and decode declare transaction v2", () => {
    const proto = encode({
      transactionType: {
        _tag: "declareV2",
        declareV2: {},
      },
    });
    expect(proto).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "$case": "declareV2",
          "declareV2": {},
        },
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "_tag": "declareV2",
          "declareV2": {},
        },
      }
    `);
  });

  it("should encode and decode declare transaction v3", () => {
    const proto = encode({
      transactionType: {
        _tag: "declareV3",
        declareV3: {},
      },
    });
    expect(proto).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "$case": "declareV3",
          "declareV3": {},
        },
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "_tag": "declareV3",
          "declareV3": {},
        },
      }
    `);
  });

  it("should encode and decode l1 handler transaction", () => {
    const proto = encode({
      transactionType: {
        _tag: "l1Handler",
        l1Handler: {},
      },
    });
    expect(proto).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "$case": "l1Handler",
          "l1Handler": {},
        },
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "_tag": "l1Handler",
          "l1Handler": {},
        },
      }
    `);
  });

  it("should encode and decode deploy account transaction v1", () => {
    const proto = encode({
      transactionType: {
        _tag: "deployAccountV1",
        deployAccountV1: {},
      },
    });
    expect(proto).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "$case": "deployAccountV1",
          "deployAccountV1": {},
        },
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "_tag": "deployAccountV1",
          "deployAccountV1": {},
        },
      }
    `);
  });

  it("should encode and decode deploy account transaction v3", () => {
    const proto = encode({
      transactionType: {
        _tag: "deployAccountV3",
        deployAccountV3: {},
      },
    });
    expect(proto).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "$case": "deployAccountV3",
          "deployAccountV3": {},
        },
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`
      {
        "transactionType": {
          "_tag": "deployAccountV3",
          "deployAccountV3": {},
        },
      }
    `);
  });
});
