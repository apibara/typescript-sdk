import { assertType, describe, test } from "vitest";

import { Block, BlockHeader, Transaction } from "./block";
import { FieldElement } from "./felt";

const address =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
const entryPointSelector =
  "0x03943907ef0ef6f9d2e2408b05e520a66daaf74293dbf665e5a20b117676170e";
const calldata = [FieldElement.parse("0x01"), FieldElement.parse("0x02")];
const meta = {
  hash: FieldElement.parse("0x01"),
  maxFee: FieldElement.parse("0x02"),
  signature: [FieldElement.parse("0x03")],
  nonce: FieldElement.parse("0x04"),
  version: "0",
};

const invokeV0 = {
  contractAddress: FieldElement.parse(address),
  entryPointSelector: FieldElement.parse(entryPointSelector),
  calldata,
};

const invokeV1 = {
  senderAddress: FieldElement.parse(address),
  calldata,
};

const deploy = {
  constructorCalldata: calldata,
  contractAddressSalt: FieldElement.parse("0x01"),
  classHash: FieldElement.parse("0x02"),
};

const declare = {
  classHash: FieldElement.parse("0x01"),
  senderAddress: FieldElement.parse(address),
  compiledClassHash: FieldElement.parse("0x02"),
};

describe("Block", () => {
  test("all optional", () => {
    assertType<Block>({});
  });
});

describe("BlockHeader", () => {
  test("all fields", () => {
    assertType<BlockHeader>({
      blockHash: FieldElement.parse("0x01"),
      parentBlockHash: FieldElement.parse("0x00"),
      blockNumber: "1",
      sequencerAddress: FieldElement.parse(address),
      newRoot: FieldElement.parse("0x02"),
      timestamp: "1",
    });
  });
});

describe("Transaction", () => {
  test("only one type", () => {
    // @ts-expect-error - should be one of the types
    assertType<Transaction>({
      meta,
      invokeV0,
      invokeV1,
    });
  });

  test("invokeV0", () => {
    assertType<Transaction>({
      meta,
      invokeV0,
    });
  });

  test("invokeV1", () => {
    assertType<Transaction>({
      meta,
      invokeV1,
    });
  });

  test("deploy", () => {
    assertType<Transaction>({
      meta,
      deploy,
    });
  });

  test("declare", () => {
    assertType<Transaction>({
      meta,
      declare,
    });
  });

  test("l1Handler", () => {
    assertType<Transaction>({
      meta,
      l1Handler: invokeV0,
    });
  });

  test("deployAccount", () => {
    assertType<Transaction>({
      meta,
      deployAccount: deploy,
    });
  });
});
