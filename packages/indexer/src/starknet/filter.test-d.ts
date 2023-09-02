import { assertType, describe, test } from "vitest";

import { FieldElement } from "./felt";
import {
  EventFilter,
  Filter,
  L2ToL1MessageFilter,
  StateUpdateFilter,
  TransactionFilter,
} from "./filter";

const address =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
const entryPointSelector =
  "0x03943907ef0ef6f9d2e2408b05e520a66daaf74293dbf665e5a20b117676170e";
const calldata = [FieldElement.parse("0x01"), FieldElement.parse("0x02")];

describe("Filter", () => {
  test("all optional", () => {
    assertType<Filter>({});
  });
});

describe("TransactionFilter", () => {
  test("all optional", () => {
    assertType<TransactionFilter>({});
  });

  test("includeReverted", () => {
    assertType<TransactionFilter>({ includeReverted: true });
  });

  test("only one inner filter", () => {
    // @ts-expect-error - multiple inner filters
    assertType<TransactionFilter>({
      invokeV0: {},
      deployAccount: {},
    });
  });

  test("filter invoke transaction v0", () => {
    assertType<TransactionFilter>({
      invokeV0: {
        contractAddress: address,
        entryPointSelector,
        calldata,
      },
    });
  });

  test("filter invoke transaction v1", () => {
    assertType<TransactionFilter>({
      invokeV1: {
        senderAddress: address,
        calldata,
      },
    });
  });

  test("filter deploy transaction", () => {
    assertType<TransactionFilter>({
      deploy: {
        contractAddressSalt: address,
        classHash: address,
        constructorCalldata: calldata,
      },
    });
  });

  test("filter declare transaction", () => {
    assertType<TransactionFilter>({
      declare: {
        senderAddress: address,
        classHash: address,
      },
    });
  });

  test("filter l1 handler transaction", () => {
    assertType<TransactionFilter>({
      l1Handler: {
        contractAddress: address,
        entryPointSelector,
        calldata,
      },
    });
  });

  test("filter deploy account transaction", () => {
    assertType<TransactionFilter>({
      deployAccount: {
        contractAddressSalt: address,
        classHash: address,
        constructorCalldata: calldata,
      },
    });
  });
});

describe("EventFilter", () => {
  test("all optional", () => {
    assertType<EventFilter>({});
  });

  test("with properties", () => {
    assertType<EventFilter>({
      fromAddress: address,
      keys: [entryPointSelector],
      includeReverted: true,
      data: calldata,
    });
  });
});

describe("L2ToL1MessageFilter", () => {
  test("all optional", () => {
    assertType<L2ToL1MessageFilter>({});
  });

  test("with properties", () => {
    assertType<L2ToL1MessageFilter>({
      toAddress: address,
      includeReverted: true,
      payload: calldata,
    });
  });
});

describe("StateUpdateFilter", () => {
  test("all optional", () => {
    assertType<StateUpdateFilter>({});
  });

  test("with storage diffs", () => {
    assertType<StateUpdateFilter>({
      storageDiffs: [
        {
          contractAddress: address,
        },
      ],
    });
  });

  test("with declared contracts", () => {
    assertType<StateUpdateFilter>({
      declaredContracts: [
        {
          classHash: address,
        },
      ],
    });
  });

  test("with deployed contracts", () => {
    assertType<StateUpdateFilter>({
      deployedContracts: [
        {
          classHash: address,
          contractAddress: address,
        },
      ],
    });
  });

  test("with nonces", () => {
    assertType<StateUpdateFilter>({
      nonces: [
        {
          contractAddress: address,
          nonce: "0x1",
        },
      ],
    });
  });

  test("with declared classes", () => {
    assertType<StateUpdateFilter>({
      declaredClasses: [
        {
          compiledClassHash: address,
          classHash: address,
        },
      ],
    });
  });

  test("with replaced classes", () => {
    assertType<StateUpdateFilter>({
      replacedClasses: [
        {
          contractAddress: address,
          classHash: address,
        },
      ],
    });
  });
});
