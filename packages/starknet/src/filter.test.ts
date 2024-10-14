import { Schema } from "@effect/schema";
import { describe, expect, it } from "vitest";

import {
  EventFilter,
  HeaderFilter,
  Key,
  TransactionFilter,
  mergeFilter,
} from "./filter";

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
          "x0": 0n,
          "x1": 0n,
          "x2": 0n,
          "x3": 4660n,
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
    expect(proto).toMatchInlineSnapshot("{}");
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot("{}");
  });

  it("should encode and decode all values", () => {
    const proto = encode({
      address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      keys: [
        "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        null,
        null,
        "0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
      ],
      strict: true,
      transactionStatus: "all",
      includeTransaction: true,
      includeReceipt: true,
      includeMessages: true,
      includeSiblings: true,
    });
    expect(proto).toMatchInlineSnapshot(`
      {
        "address": {
          "x0": 0n,
          "x1": 170n,
          "x2": 12297829382473034410n,
          "x3": 12297829382473034410n,
        },
        "includeMessages": true,
        "includeReceipt": true,
        "includeSiblings": true,
        "includeTransaction": true,
        "keys": [
          {
            "value": {
              "x0": 0n,
              "x1": 187n,
              "x2": 13527612320720337851n,
              "x3": 13527612320720337851n,
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
              "x0": 0n,
              "x1": 0n,
              "x2": 14757395258967641292n,
              "x3": 14757395258967641292n,
            },
          },
        ],
        "strict": true,
        "transactionStatus": 3,
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`
      {
        "address": "0x000000000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "includeMessages": true,
        "includeReceipt": true,
        "includeSiblings": true,
        "includeTransaction": true,
        "keys": [
          "0x000000000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          null,
          null,
          "0x00000000000000000000000000000000cccccccccccccccccccccccccccccccc",
        ],
        "strict": true,
        "transactionStatus": "all",
      }
    `);
  });
});

describe("TransactionFilter", () => {
  const encode = Schema.encodeSync(TransactionFilter);
  const decode = Schema.decodeSync(TransactionFilter);

  it("should encode and decode default values", () => {
    const proto = encode({});
    expect(proto).toMatchInlineSnapshot("{}");
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot("{}");
  });

  it("should encode and decode extra fields", () => {
    const proto = encode({
      includeEvents: true,
      includeMessages: true,
      includeReceipt: true,
      transactionStatus: "reverted",
    });
    expect(proto).toMatchInlineSnapshot(`
      {
        "includeEvents": true,
        "includeMessages": true,
        "includeReceipt": true,
        "transactionStatus": 2,
      }
    `);
    const decoded = decode(proto);
    expect(decoded).toMatchInlineSnapshot(`
      {
        "includeEvents": true,
        "includeMessages": true,
        "includeReceipt": true,
        "transactionStatus": "reverted",
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

describe("mergeFilter", () => {
  it("returns header.always if any has it", () => {
    const fa = mergeFilter({}, { header: { always: true } });
    expect(fa).toMatchInlineSnapshot(`
      {
        "events": [],
        "header": {
          "always": true,
        },
        "messages": [],
        "transactions": [],
      }
    `);
    const fb = mergeFilter({ header: { always: true } }, {});
    expect(fb).toMatchInlineSnapshot(`
      {
        "events": [],
        "header": {
          "always": true,
        },
        "messages": [],
        "transactions": [],
      }
    `);
  });

  it("returns an empty header by default", () => {
    const f = mergeFilter({}, {});
    expect(f).toMatchInlineSnapshot(`
      {
        "events": [],
        "header": undefined,
        "messages": [],
        "transactions": [],
      }
    `);
  });

  it("concatenates transactions", () => {
    const f = mergeFilter(
      {
        transactions: [{ transactionType: { _tag: "invokeV0", invokeV0: {} } }],
      },
      {
        transactions: [{ transactionType: { _tag: "invokeV3", invokeV3: {} } }],
      },
    );
    expect(f).toMatchInlineSnapshot(`
      {
        "events": [],
        "header": undefined,
        "messages": [],
        "transactions": [
          {
            "transactionType": {
              "_tag": "invokeV0",
              "invokeV0": {},
            },
          },
          {
            "transactionType": {
              "_tag": "invokeV3",
              "invokeV3": {},
            },
          },
        ],
      }
    `);
  });

  it("concatenates events", () => {
    const f = mergeFilter(
      { events: [{ address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }] },
      { events: [{ address: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB" }] },
    );
    expect(f).toMatchInlineSnapshot(`
      {
        "events": [
          {
            "address": "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          },
          {
            "address": "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
          },
        ],
        "header": undefined,
        "messages": [],
        "transactions": [],
      }
    `);
  });

  it("concatenates messages", () => {
    const f = mergeFilter(
      { messages: [{ fromAddress: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }] },
      { messages: [{ fromAddress: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB" }] },
    );
    expect(f).toMatchInlineSnapshot(`
      {
        "events": [],
        "header": undefined,
        "messages": [
          {
            "fromAddress": "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          },
          {
            "fromAddress": "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
          },
        ],
        "transactions": [],
      }
    `);
  });
});
