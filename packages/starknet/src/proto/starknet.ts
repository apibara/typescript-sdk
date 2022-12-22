/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { Timestamp } from "./google/protobuf/timestamp";
import { FieldElement } from "./types";

export const protobufPackage = "apibara.starknet.v1alpha2";

/** Apibara StarkNet Support */

/** Status of a block. */
export enum BlockStatus {
  /** BLOCK_STATUS_UNSPECIFIED - Unknown block status. */
  BLOCK_STATUS_UNSPECIFIED = 0,
  /** BLOCK_STATUS_PENDING - Block not accepted yet. */
  BLOCK_STATUS_PENDING = 1,
  /** BLOCK_STATUS_ACCEPTED_ON_L2 - Block accepted on L2. */
  BLOCK_STATUS_ACCEPTED_ON_L2 = 2,
  /** BLOCK_STATUS_ACCEPTED_ON_L1 - Block finalized on L1. */
  BLOCK_STATUS_ACCEPTED_ON_L1 = 3,
  /** BLOCK_STATUS_REJECTED - Block was rejected and is not part of the canonical chain anymore. */
  BLOCK_STATUS_REJECTED = 4,
  UNRECOGNIZED = -1,
}

export function blockStatusFromJSON(object: any): BlockStatus {
  switch (object) {
    case 0:
    case "BLOCK_STATUS_UNSPECIFIED":
      return BlockStatus.BLOCK_STATUS_UNSPECIFIED;
    case 1:
    case "BLOCK_STATUS_PENDING":
      return BlockStatus.BLOCK_STATUS_PENDING;
    case 2:
    case "BLOCK_STATUS_ACCEPTED_ON_L2":
      return BlockStatus.BLOCK_STATUS_ACCEPTED_ON_L2;
    case 3:
    case "BLOCK_STATUS_ACCEPTED_ON_L1":
      return BlockStatus.BLOCK_STATUS_ACCEPTED_ON_L1;
    case 4:
    case "BLOCK_STATUS_REJECTED":
      return BlockStatus.BLOCK_STATUS_REJECTED;
    case -1:
    case "UNRECOGNIZED":
    default:
      return BlockStatus.UNRECOGNIZED;
  }
}

export function blockStatusToJSON(object: BlockStatus): string {
  switch (object) {
    case BlockStatus.BLOCK_STATUS_UNSPECIFIED:
      return "BLOCK_STATUS_UNSPECIFIED";
    case BlockStatus.BLOCK_STATUS_PENDING:
      return "BLOCK_STATUS_PENDING";
    case BlockStatus.BLOCK_STATUS_ACCEPTED_ON_L2:
      return "BLOCK_STATUS_ACCEPTED_ON_L2";
    case BlockStatus.BLOCK_STATUS_ACCEPTED_ON_L1:
      return "BLOCK_STATUS_ACCEPTED_ON_L1";
    case BlockStatus.BLOCK_STATUS_REJECTED:
      return "BLOCK_STATUS_REJECTED";
    case BlockStatus.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

/** A StarkNet block. */
export interface Block {
  /** Block status. */
  status: BlockStatus;
  /** Block header. */
  header:
    | BlockHeader
    | undefined;
  /** Transactions in the block. */
  transactions: TransactionWithReceipt[];
  /** State update caused by the block. */
  stateUpdate:
    | StateUpdate
    | undefined;
  /** Events emitted in the block. */
  events: EventWithTransaction[];
  /** Messages to L1 sent in the block. */
  l2ToL1Messages: L2ToL1MessageWithTransaction[];
}

/** Block header. */
export interface BlockHeader {
  /** Hash of the block. */
  blockHash:
    | FieldElement
    | undefined;
  /** Hash of the block's parent. */
  parentBlockHash:
    | FieldElement
    | undefined;
  /** Block height. */
  blockNumber: Long;
  /** Sequencer address. */
  sequencerAddress:
    | FieldElement
    | undefined;
  /** New state root after the block. */
  newRoot:
    | FieldElement
    | undefined;
  /** Timestamp when block  was produced. */
  timestamp: Date | undefined;
}

/** A transaction with its receipt. */
export interface TransactionWithReceipt {
  /** The transaction */
  transaction:
    | Transaction
    | undefined;
  /** The transaction receipt. */
  receipt: TransactionReceipt | undefined;
}

/** A transaction. */
export interface Transaction {
  /** Common transaction metadata. */
  meta:
    | TransactionMeta
    | undefined;
  /** Transaction invoking a smart contract, V0. */
  invokeV0:
    | InvokeTransactionV0
    | undefined;
  /** Transaction invoking a smart contract, V1. */
  invokeV1:
    | InvokeTransactionV1
    | undefined;
  /** Transaction deploying a new smart contract. */
  deploy:
    | DeployTransaction
    | undefined;
  /** Transaction declaring a smart contract. */
  declare:
    | DeclareTransaction
    | undefined;
  /** Transaction handling a message from L1. */
  l1Handler:
    | L1HandlerTransaction
    | undefined;
  /** Transaction deploying a new account. */
  deployAccount: DeployAccountTransaction | undefined;
}

/** Common transaction metadata. */
export interface TransactionMeta {
  /** Transaction hash. */
  hash:
    | FieldElement
    | undefined;
  /** Maximum fee to be paid. */
  maxFee:
    | FieldElement
    | undefined;
  /** Signature by the user. */
  signature: FieldElement[];
  /** Nonce. */
  nonce:
    | FieldElement
    | undefined;
  /** Version. */
  version: Long;
}

/** Transaction invoking a smart contract, V0. */
export interface InvokeTransactionV0 {
  /** Target contract address. */
  contractAddress:
    | FieldElement
    | undefined;
  /** Selector of the function being invoked. */
  entryPointSelector:
    | FieldElement
    | undefined;
  /** Raw calldata. */
  calldata: FieldElement[];
}

/** Transaction invoking a smart contract, V1. */
export interface InvokeTransactionV1 {
  /** Address sending the transaction. */
  senderAddress:
    | FieldElement
    | undefined;
  /** Raw calldata. */
  calldata: FieldElement[];
}

/** Transaction deploying a new smart contract. */
export interface DeployTransaction {
  /** Raw calldata passed to the constructor. */
  constructorCalldata: FieldElement[];
  /** Salt used when computing the contract's address. */
  contractAddressSalt:
    | FieldElement
    | undefined;
  /** Hash of the class being deployed. */
  classHash: FieldElement | undefined;
}

/** Transaction declaring a smart contract. */
export interface DeclareTransaction {
  /** Class hash. */
  classHash:
    | FieldElement
    | undefined;
  /** Address of the account declaring the class. */
  senderAddress: FieldElement | undefined;
}

/** Transaction handling a message from L1. */
export interface L1HandlerTransaction {
  /** Target contract address. */
  contractAddress:
    | FieldElement
    | undefined;
  /** Selector of the function being invoked. */
  entryPointSelector:
    | FieldElement
    | undefined;
  /** Raw calldata. */
  calldata: FieldElement[];
}

/** Transaction deploying a new account. */
export interface DeployAccountTransaction {
  /** Raw calldata passed to the constructor. */
  constructorCalldata: FieldElement[];
  /** Salt used when computing the contract's address. */
  contractAddressSalt:
    | FieldElement
    | undefined;
  /** Hash of the class being deployed. */
  classHash: FieldElement | undefined;
}

/**
 * Result of the execution of a transaction.
 *
 * This message only contains the receipt data, if you also need the
 * transaction, request a `Transaction`.
 */
export interface TransactionReceipt {
  /** Hash of the transaction. */
  transactionHash:
    | FieldElement
    | undefined;
  /** Transaction's indexe in the list of transactions in a block. */
  transactionIndex: Long;
  /** Feed paid. */
  actualFee:
    | FieldElement
    | undefined;
  /** Messages sent to L1 in the transactions. */
  l2ToL1Messages: L2ToL1Message[];
  /** Events emitted in the transaction. */
  events: Event[];
}

/** Message sent from L2 to L1 together with its transaction and receipt. */
export interface L2ToL1MessageWithTransaction {
  /** The transaction that sent this message. */
  transaction:
    | Transaction
    | undefined;
  /** The transaction receipt. */
  receipt:
    | TransactionReceipt
    | undefined;
  /** The message. */
  message: L2ToL1Message | undefined;
}

/** Message sent from L2 to L1. */
export interface L2ToL1Message {
  /** Destination address. */
  toAddress:
    | FieldElement
    | undefined;
  /** Data contained in the message. */
  payload: FieldElement[];
}

/** Event emitted by a transaction, together with its transaction and receipt. */
export interface EventWithTransaction {
  /** The transaction emitting the event. */
  transaction:
    | Transaction
    | undefined;
  /** The transaction receipt. */
  receipt:
    | TransactionReceipt
    | undefined;
  /** The event. */
  event: Event | undefined;
}

/** Event emitted by a transaction. */
export interface Event {
  /** Address of the smart contract emitting the event. */
  fromAddress:
    | FieldElement
    | undefined;
  /** Event key. */
  keys: FieldElement[];
  /** Event data. */
  data: FieldElement[];
}

/** State update. */
export interface StateUpdate {
  /** New state root. */
  newRoot:
    | FieldElement
    | undefined;
  /** Previous state root. */
  oldRoot:
    | FieldElement
    | undefined;
  /** State difference. */
  stateDiff: StateDiff | undefined;
}

/** Difference in state between blocks. */
export interface StateDiff {
  /** Storage differences. */
  storageDiffs: StorageDiff[];
  /** Contracts declared. */
  declaredContracts: DeclaredContract[];
  /** Contracts deployed. */
  deployedContracts: DeployedContract[];
  /** Nonces updated. */
  nonces: NonceUpdate[];
}

/** Difference in storage values for a contract. */
export interface StorageDiff {
  /** The contract address. */
  contractAddress:
    | FieldElement
    | undefined;
  /** Entries that changed. */
  storageEntries: StorageEntry[];
}

/** Storage entry. */
export interface StorageEntry {
  /** Storage location. */
  key:
    | FieldElement
    | undefined;
  /** Storage value. */
  value: FieldElement | undefined;
}

/** Contract declared. */
export interface DeclaredContract {
  /** Class hash of the newly declared contract. */
  classHash: FieldElement | undefined;
}

/** Contract deployed. */
export interface DeployedContract {
  /** Address of the newly deployed contract. */
  contractAddress:
    | FieldElement
    | undefined;
  /** Class hash of the deployed contract. */
  classHash: FieldElement | undefined;
}

/** Nonce update. */
export interface NonceUpdate {
  /** Contract address. */
  contractAddress:
    | FieldElement
    | undefined;
  /** New nonce value. */
  nonce: FieldElement | undefined;
}

function createBaseBlock(): Block {
  return { status: 0, header: undefined, transactions: [], stateUpdate: undefined, events: [], l2ToL1Messages: [] };
}

export const Block = {
  encode(message: Block, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.status !== 0) {
      writer.uint32(8).int32(message.status);
    }
    if (message.header !== undefined) {
      BlockHeader.encode(message.header, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.transactions) {
      TransactionWithReceipt.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.stateUpdate !== undefined) {
      StateUpdate.encode(message.stateUpdate, writer.uint32(34).fork()).ldelim();
    }
    for (const v of message.events) {
      EventWithTransaction.encode(v!, writer.uint32(42).fork()).ldelim();
    }
    for (const v of message.l2ToL1Messages) {
      L2ToL1MessageWithTransaction.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Block {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBlock();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.status = reader.int32() as any;
          break;
        case 2:
          message.header = BlockHeader.decode(reader, reader.uint32());
          break;
        case 3:
          message.transactions.push(TransactionWithReceipt.decode(reader, reader.uint32()));
          break;
        case 4:
          message.stateUpdate = StateUpdate.decode(reader, reader.uint32());
          break;
        case 5:
          message.events.push(EventWithTransaction.decode(reader, reader.uint32()));
          break;
        case 6:
          message.l2ToL1Messages.push(L2ToL1MessageWithTransaction.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Block {
    return {
      status: isSet(object.status) ? blockStatusFromJSON(object.status) : 0,
      header: isSet(object.header) ? BlockHeader.fromJSON(object.header) : undefined,
      transactions: Array.isArray(object?.transactions)
        ? object.transactions.map((e: any) => TransactionWithReceipt.fromJSON(e))
        : [],
      stateUpdate: isSet(object.stateUpdate) ? StateUpdate.fromJSON(object.stateUpdate) : undefined,
      events: Array.isArray(object?.events) ? object.events.map((e: any) => EventWithTransaction.fromJSON(e)) : [],
      l2ToL1Messages: Array.isArray(object?.l2ToL1Messages)
        ? object.l2ToL1Messages.map((e: any) => L2ToL1MessageWithTransaction.fromJSON(e))
        : [],
    };
  },

  toJSON(message: Block): unknown {
    const obj: any = {};
    message.status !== undefined && (obj.status = blockStatusToJSON(message.status));
    message.header !== undefined && (obj.header = message.header ? BlockHeader.toJSON(message.header) : undefined);
    if (message.transactions) {
      obj.transactions = message.transactions.map((e) => e ? TransactionWithReceipt.toJSON(e) : undefined);
    } else {
      obj.transactions = [];
    }
    message.stateUpdate !== undefined &&
      (obj.stateUpdate = message.stateUpdate ? StateUpdate.toJSON(message.stateUpdate) : undefined);
    if (message.events) {
      obj.events = message.events.map((e) => e ? EventWithTransaction.toJSON(e) : undefined);
    } else {
      obj.events = [];
    }
    if (message.l2ToL1Messages) {
      obj.l2ToL1Messages = message.l2ToL1Messages.map((e) => e ? L2ToL1MessageWithTransaction.toJSON(e) : undefined);
    } else {
      obj.l2ToL1Messages = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<Block>): Block {
    const message = createBaseBlock();
    message.status = object.status ?? 0;
    message.header = (object.header !== undefined && object.header !== null)
      ? BlockHeader.fromPartial(object.header)
      : undefined;
    message.transactions = object.transactions?.map((e) => TransactionWithReceipt.fromPartial(e)) || [];
    message.stateUpdate = (object.stateUpdate !== undefined && object.stateUpdate !== null)
      ? StateUpdate.fromPartial(object.stateUpdate)
      : undefined;
    message.events = object.events?.map((e) => EventWithTransaction.fromPartial(e)) || [];
    message.l2ToL1Messages = object.l2ToL1Messages?.map((e) => L2ToL1MessageWithTransaction.fromPartial(e)) || [];
    return message;
  },
};

function createBaseBlockHeader(): BlockHeader {
  return {
    blockHash: undefined,
    parentBlockHash: undefined,
    blockNumber: Long.UZERO,
    sequencerAddress: undefined,
    newRoot: undefined,
    timestamp: undefined,
  };
}

export const BlockHeader = {
  encode(message: BlockHeader, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.blockHash !== undefined) {
      FieldElement.encode(message.blockHash, writer.uint32(10).fork()).ldelim();
    }
    if (message.parentBlockHash !== undefined) {
      FieldElement.encode(message.parentBlockHash, writer.uint32(18).fork()).ldelim();
    }
    if (!message.blockNumber.isZero()) {
      writer.uint32(24).uint64(message.blockNumber);
    }
    if (message.sequencerAddress !== undefined) {
      FieldElement.encode(message.sequencerAddress, writer.uint32(34).fork()).ldelim();
    }
    if (message.newRoot !== undefined) {
      FieldElement.encode(message.newRoot, writer.uint32(42).fork()).ldelim();
    }
    if (message.timestamp !== undefined) {
      Timestamp.encode(toTimestamp(message.timestamp), writer.uint32(50).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BlockHeader {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBlockHeader();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.blockHash = FieldElement.decode(reader, reader.uint32());
          break;
        case 2:
          message.parentBlockHash = FieldElement.decode(reader, reader.uint32());
          break;
        case 3:
          message.blockNumber = reader.uint64() as Long;
          break;
        case 4:
          message.sequencerAddress = FieldElement.decode(reader, reader.uint32());
          break;
        case 5:
          message.newRoot = FieldElement.decode(reader, reader.uint32());
          break;
        case 6:
          message.timestamp = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): BlockHeader {
    return {
      blockHash: isSet(object.blockHash) ? FieldElement.fromJSON(object.blockHash) : undefined,
      parentBlockHash: isSet(object.parentBlockHash) ? FieldElement.fromJSON(object.parentBlockHash) : undefined,
      blockNumber: isSet(object.blockNumber) ? Long.fromValue(object.blockNumber) : Long.UZERO,
      sequencerAddress: isSet(object.sequencerAddress) ? FieldElement.fromJSON(object.sequencerAddress) : undefined,
      newRoot: isSet(object.newRoot) ? FieldElement.fromJSON(object.newRoot) : undefined,
      timestamp: isSet(object.timestamp) ? fromJsonTimestamp(object.timestamp) : undefined,
    };
  },

  toJSON(message: BlockHeader): unknown {
    const obj: any = {};
    message.blockHash !== undefined &&
      (obj.blockHash = message.blockHash ? FieldElement.toJSON(message.blockHash) : undefined);
    message.parentBlockHash !== undefined &&
      (obj.parentBlockHash = message.parentBlockHash ? FieldElement.toJSON(message.parentBlockHash) : undefined);
    message.blockNumber !== undefined && (obj.blockNumber = (message.blockNumber || Long.UZERO).toString());
    message.sequencerAddress !== undefined &&
      (obj.sequencerAddress = message.sequencerAddress ? FieldElement.toJSON(message.sequencerAddress) : undefined);
    message.newRoot !== undefined && (obj.newRoot = message.newRoot ? FieldElement.toJSON(message.newRoot) : undefined);
    message.timestamp !== undefined && (obj.timestamp = message.timestamp.toISOString());
    return obj;
  },

  fromPartial(object: DeepPartial<BlockHeader>): BlockHeader {
    const message = createBaseBlockHeader();
    message.blockHash = (object.blockHash !== undefined && object.blockHash !== null)
      ? FieldElement.fromPartial(object.blockHash)
      : undefined;
    message.parentBlockHash = (object.parentBlockHash !== undefined && object.parentBlockHash !== null)
      ? FieldElement.fromPartial(object.parentBlockHash)
      : undefined;
    message.blockNumber = (object.blockNumber !== undefined && object.blockNumber !== null)
      ? Long.fromValue(object.blockNumber)
      : Long.UZERO;
    message.sequencerAddress = (object.sequencerAddress !== undefined && object.sequencerAddress !== null)
      ? FieldElement.fromPartial(object.sequencerAddress)
      : undefined;
    message.newRoot = (object.newRoot !== undefined && object.newRoot !== null)
      ? FieldElement.fromPartial(object.newRoot)
      : undefined;
    message.timestamp = object.timestamp ?? undefined;
    return message;
  },
};

function createBaseTransactionWithReceipt(): TransactionWithReceipt {
  return { transaction: undefined, receipt: undefined };
}

export const TransactionWithReceipt = {
  encode(message: TransactionWithReceipt, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.transaction !== undefined) {
      Transaction.encode(message.transaction, writer.uint32(10).fork()).ldelim();
    }
    if (message.receipt !== undefined) {
      TransactionReceipt.encode(message.receipt, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionWithReceipt {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionWithReceipt();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.transaction = Transaction.decode(reader, reader.uint32());
          break;
        case 2:
          message.receipt = TransactionReceipt.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): TransactionWithReceipt {
    return {
      transaction: isSet(object.transaction) ? Transaction.fromJSON(object.transaction) : undefined,
      receipt: isSet(object.receipt) ? TransactionReceipt.fromJSON(object.receipt) : undefined,
    };
  },

  toJSON(message: TransactionWithReceipt): unknown {
    const obj: any = {};
    message.transaction !== undefined &&
      (obj.transaction = message.transaction ? Transaction.toJSON(message.transaction) : undefined);
    message.receipt !== undefined &&
      (obj.receipt = message.receipt ? TransactionReceipt.toJSON(message.receipt) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<TransactionWithReceipt>): TransactionWithReceipt {
    const message = createBaseTransactionWithReceipt();
    message.transaction = (object.transaction !== undefined && object.transaction !== null)
      ? Transaction.fromPartial(object.transaction)
      : undefined;
    message.receipt = (object.receipt !== undefined && object.receipt !== null)
      ? TransactionReceipt.fromPartial(object.receipt)
      : undefined;
    return message;
  },
};

function createBaseTransaction(): Transaction {
  return {
    meta: undefined,
    invokeV0: undefined,
    invokeV1: undefined,
    deploy: undefined,
    declare: undefined,
    l1Handler: undefined,
    deployAccount: undefined,
  };
}

export const Transaction = {
  encode(message: Transaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.meta !== undefined) {
      TransactionMeta.encode(message.meta, writer.uint32(10).fork()).ldelim();
    }
    if (message.invokeV0 !== undefined) {
      InvokeTransactionV0.encode(message.invokeV0, writer.uint32(18).fork()).ldelim();
    }
    if (message.invokeV1 !== undefined) {
      InvokeTransactionV1.encode(message.invokeV1, writer.uint32(26).fork()).ldelim();
    }
    if (message.deploy !== undefined) {
      DeployTransaction.encode(message.deploy, writer.uint32(34).fork()).ldelim();
    }
    if (message.declare !== undefined) {
      DeclareTransaction.encode(message.declare, writer.uint32(42).fork()).ldelim();
    }
    if (message.l1Handler !== undefined) {
      L1HandlerTransaction.encode(message.l1Handler, writer.uint32(50).fork()).ldelim();
    }
    if (message.deployAccount !== undefined) {
      DeployAccountTransaction.encode(message.deployAccount, writer.uint32(58).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Transaction {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransaction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.meta = TransactionMeta.decode(reader, reader.uint32());
          break;
        case 2:
          message.invokeV0 = InvokeTransactionV0.decode(reader, reader.uint32());
          break;
        case 3:
          message.invokeV1 = InvokeTransactionV1.decode(reader, reader.uint32());
          break;
        case 4:
          message.deploy = DeployTransaction.decode(reader, reader.uint32());
          break;
        case 5:
          message.declare = DeclareTransaction.decode(reader, reader.uint32());
          break;
        case 6:
          message.l1Handler = L1HandlerTransaction.decode(reader, reader.uint32());
          break;
        case 7:
          message.deployAccount = DeployAccountTransaction.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Transaction {
    return {
      meta: isSet(object.meta) ? TransactionMeta.fromJSON(object.meta) : undefined,
      invokeV0: isSet(object.invokeV0) ? InvokeTransactionV0.fromJSON(object.invokeV0) : undefined,
      invokeV1: isSet(object.invokeV1) ? InvokeTransactionV1.fromJSON(object.invokeV1) : undefined,
      deploy: isSet(object.deploy) ? DeployTransaction.fromJSON(object.deploy) : undefined,
      declare: isSet(object.declare) ? DeclareTransaction.fromJSON(object.declare) : undefined,
      l1Handler: isSet(object.l1Handler) ? L1HandlerTransaction.fromJSON(object.l1Handler) : undefined,
      deployAccount: isSet(object.deployAccount) ? DeployAccountTransaction.fromJSON(object.deployAccount) : undefined,
    };
  },

  toJSON(message: Transaction): unknown {
    const obj: any = {};
    message.meta !== undefined && (obj.meta = message.meta ? TransactionMeta.toJSON(message.meta) : undefined);
    message.invokeV0 !== undefined &&
      (obj.invokeV0 = message.invokeV0 ? InvokeTransactionV0.toJSON(message.invokeV0) : undefined);
    message.invokeV1 !== undefined &&
      (obj.invokeV1 = message.invokeV1 ? InvokeTransactionV1.toJSON(message.invokeV1) : undefined);
    message.deploy !== undefined &&
      (obj.deploy = message.deploy ? DeployTransaction.toJSON(message.deploy) : undefined);
    message.declare !== undefined &&
      (obj.declare = message.declare ? DeclareTransaction.toJSON(message.declare) : undefined);
    message.l1Handler !== undefined &&
      (obj.l1Handler = message.l1Handler ? L1HandlerTransaction.toJSON(message.l1Handler) : undefined);
    message.deployAccount !== undefined &&
      (obj.deployAccount = message.deployAccount ? DeployAccountTransaction.toJSON(message.deployAccount) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<Transaction>): Transaction {
    const message = createBaseTransaction();
    message.meta = (object.meta !== undefined && object.meta !== null)
      ? TransactionMeta.fromPartial(object.meta)
      : undefined;
    message.invokeV0 = (object.invokeV0 !== undefined && object.invokeV0 !== null)
      ? InvokeTransactionV0.fromPartial(object.invokeV0)
      : undefined;
    message.invokeV1 = (object.invokeV1 !== undefined && object.invokeV1 !== null)
      ? InvokeTransactionV1.fromPartial(object.invokeV1)
      : undefined;
    message.deploy = (object.deploy !== undefined && object.deploy !== null)
      ? DeployTransaction.fromPartial(object.deploy)
      : undefined;
    message.declare = (object.declare !== undefined && object.declare !== null)
      ? DeclareTransaction.fromPartial(object.declare)
      : undefined;
    message.l1Handler = (object.l1Handler !== undefined && object.l1Handler !== null)
      ? L1HandlerTransaction.fromPartial(object.l1Handler)
      : undefined;
    message.deployAccount = (object.deployAccount !== undefined && object.deployAccount !== null)
      ? DeployAccountTransaction.fromPartial(object.deployAccount)
      : undefined;
    return message;
  },
};

function createBaseTransactionMeta(): TransactionMeta {
  return { hash: undefined, maxFee: undefined, signature: [], nonce: undefined, version: Long.UZERO };
}

export const TransactionMeta = {
  encode(message: TransactionMeta, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.hash !== undefined) {
      FieldElement.encode(message.hash, writer.uint32(10).fork()).ldelim();
    }
    if (message.maxFee !== undefined) {
      FieldElement.encode(message.maxFee, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.signature) {
      FieldElement.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.nonce !== undefined) {
      FieldElement.encode(message.nonce, writer.uint32(34).fork()).ldelim();
    }
    if (!message.version.isZero()) {
      writer.uint32(40).uint64(message.version);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionMeta {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionMeta();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.hash = FieldElement.decode(reader, reader.uint32());
          break;
        case 2:
          message.maxFee = FieldElement.decode(reader, reader.uint32());
          break;
        case 3:
          message.signature.push(FieldElement.decode(reader, reader.uint32()));
          break;
        case 4:
          message.nonce = FieldElement.decode(reader, reader.uint32());
          break;
        case 5:
          message.version = reader.uint64() as Long;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): TransactionMeta {
    return {
      hash: isSet(object.hash) ? FieldElement.fromJSON(object.hash) : undefined,
      maxFee: isSet(object.maxFee) ? FieldElement.fromJSON(object.maxFee) : undefined,
      signature: Array.isArray(object?.signature) ? object.signature.map((e: any) => FieldElement.fromJSON(e)) : [],
      nonce: isSet(object.nonce) ? FieldElement.fromJSON(object.nonce) : undefined,
      version: isSet(object.version) ? Long.fromValue(object.version) : Long.UZERO,
    };
  },

  toJSON(message: TransactionMeta): unknown {
    const obj: any = {};
    message.hash !== undefined && (obj.hash = message.hash ? FieldElement.toJSON(message.hash) : undefined);
    message.maxFee !== undefined && (obj.maxFee = message.maxFee ? FieldElement.toJSON(message.maxFee) : undefined);
    if (message.signature) {
      obj.signature = message.signature.map((e) => e ? FieldElement.toJSON(e) : undefined);
    } else {
      obj.signature = [];
    }
    message.nonce !== undefined && (obj.nonce = message.nonce ? FieldElement.toJSON(message.nonce) : undefined);
    message.version !== undefined && (obj.version = (message.version || Long.UZERO).toString());
    return obj;
  },

  fromPartial(object: DeepPartial<TransactionMeta>): TransactionMeta {
    const message = createBaseTransactionMeta();
    message.hash = (object.hash !== undefined && object.hash !== null)
      ? FieldElement.fromPartial(object.hash)
      : undefined;
    message.maxFee = (object.maxFee !== undefined && object.maxFee !== null)
      ? FieldElement.fromPartial(object.maxFee)
      : undefined;
    message.signature = object.signature?.map((e) => FieldElement.fromPartial(e)) || [];
    message.nonce = (object.nonce !== undefined && object.nonce !== null)
      ? FieldElement.fromPartial(object.nonce)
      : undefined;
    message.version = (object.version !== undefined && object.version !== null)
      ? Long.fromValue(object.version)
      : Long.UZERO;
    return message;
  },
};

function createBaseInvokeTransactionV0(): InvokeTransactionV0 {
  return { contractAddress: undefined, entryPointSelector: undefined, calldata: [] };
}

export const InvokeTransactionV0 = {
  encode(message: InvokeTransactionV0, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.contractAddress !== undefined) {
      FieldElement.encode(message.contractAddress, writer.uint32(10).fork()).ldelim();
    }
    if (message.entryPointSelector !== undefined) {
      FieldElement.encode(message.entryPointSelector, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.calldata) {
      FieldElement.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): InvokeTransactionV0 {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInvokeTransactionV0();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.contractAddress = FieldElement.decode(reader, reader.uint32());
          break;
        case 2:
          message.entryPointSelector = FieldElement.decode(reader, reader.uint32());
          break;
        case 3:
          message.calldata.push(FieldElement.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): InvokeTransactionV0 {
    return {
      contractAddress: isSet(object.contractAddress) ? FieldElement.fromJSON(object.contractAddress) : undefined,
      entryPointSelector: isSet(object.entryPointSelector)
        ? FieldElement.fromJSON(object.entryPointSelector)
        : undefined,
      calldata: Array.isArray(object?.calldata) ? object.calldata.map((e: any) => FieldElement.fromJSON(e)) : [],
    };
  },

  toJSON(message: InvokeTransactionV0): unknown {
    const obj: any = {};
    message.contractAddress !== undefined &&
      (obj.contractAddress = message.contractAddress ? FieldElement.toJSON(message.contractAddress) : undefined);
    message.entryPointSelector !== undefined &&
      (obj.entryPointSelector = message.entryPointSelector
        ? FieldElement.toJSON(message.entryPointSelector)
        : undefined);
    if (message.calldata) {
      obj.calldata = message.calldata.map((e) => e ? FieldElement.toJSON(e) : undefined);
    } else {
      obj.calldata = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<InvokeTransactionV0>): InvokeTransactionV0 {
    const message = createBaseInvokeTransactionV0();
    message.contractAddress = (object.contractAddress !== undefined && object.contractAddress !== null)
      ? FieldElement.fromPartial(object.contractAddress)
      : undefined;
    message.entryPointSelector = (object.entryPointSelector !== undefined && object.entryPointSelector !== null)
      ? FieldElement.fromPartial(object.entryPointSelector)
      : undefined;
    message.calldata = object.calldata?.map((e) => FieldElement.fromPartial(e)) || [];
    return message;
  },
};

function createBaseInvokeTransactionV1(): InvokeTransactionV1 {
  return { senderAddress: undefined, calldata: [] };
}

export const InvokeTransactionV1 = {
  encode(message: InvokeTransactionV1, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.senderAddress !== undefined) {
      FieldElement.encode(message.senderAddress, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.calldata) {
      FieldElement.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): InvokeTransactionV1 {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInvokeTransactionV1();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.senderAddress = FieldElement.decode(reader, reader.uint32());
          break;
        case 2:
          message.calldata.push(FieldElement.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): InvokeTransactionV1 {
    return {
      senderAddress: isSet(object.senderAddress) ? FieldElement.fromJSON(object.senderAddress) : undefined,
      calldata: Array.isArray(object?.calldata) ? object.calldata.map((e: any) => FieldElement.fromJSON(e)) : [],
    };
  },

  toJSON(message: InvokeTransactionV1): unknown {
    const obj: any = {};
    message.senderAddress !== undefined &&
      (obj.senderAddress = message.senderAddress ? FieldElement.toJSON(message.senderAddress) : undefined);
    if (message.calldata) {
      obj.calldata = message.calldata.map((e) => e ? FieldElement.toJSON(e) : undefined);
    } else {
      obj.calldata = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<InvokeTransactionV1>): InvokeTransactionV1 {
    const message = createBaseInvokeTransactionV1();
    message.senderAddress = (object.senderAddress !== undefined && object.senderAddress !== null)
      ? FieldElement.fromPartial(object.senderAddress)
      : undefined;
    message.calldata = object.calldata?.map((e) => FieldElement.fromPartial(e)) || [];
    return message;
  },
};

function createBaseDeployTransaction(): DeployTransaction {
  return { constructorCalldata: [], contractAddressSalt: undefined, classHash: undefined };
}

export const DeployTransaction = {
  encode(message: DeployTransaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.constructorCalldata) {
      FieldElement.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.contractAddressSalt !== undefined) {
      FieldElement.encode(message.contractAddressSalt, writer.uint32(26).fork()).ldelim();
    }
    if (message.classHash !== undefined) {
      FieldElement.encode(message.classHash, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeployTransaction {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeployTransaction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          message.constructorCalldata.push(FieldElement.decode(reader, reader.uint32()));
          break;
        case 3:
          message.contractAddressSalt = FieldElement.decode(reader, reader.uint32());
          break;
        case 4:
          message.classHash = FieldElement.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): DeployTransaction {
    return {
      constructorCalldata: Array.isArray(object?.constructorCalldata)
        ? object.constructorCalldata.map((e: any) => FieldElement.fromJSON(e))
        : [],
      contractAddressSalt: isSet(object.contractAddressSalt)
        ? FieldElement.fromJSON(object.contractAddressSalt)
        : undefined,
      classHash: isSet(object.classHash) ? FieldElement.fromJSON(object.classHash) : undefined,
    };
  },

  toJSON(message: DeployTransaction): unknown {
    const obj: any = {};
    if (message.constructorCalldata) {
      obj.constructorCalldata = message.constructorCalldata.map((e) => e ? FieldElement.toJSON(e) : undefined);
    } else {
      obj.constructorCalldata = [];
    }
    message.contractAddressSalt !== undefined && (obj.contractAddressSalt = message.contractAddressSalt
      ? FieldElement.toJSON(message.contractAddressSalt)
      : undefined);
    message.classHash !== undefined &&
      (obj.classHash = message.classHash ? FieldElement.toJSON(message.classHash) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<DeployTransaction>): DeployTransaction {
    const message = createBaseDeployTransaction();
    message.constructorCalldata = object.constructorCalldata?.map((e) => FieldElement.fromPartial(e)) || [];
    message.contractAddressSalt = (object.contractAddressSalt !== undefined && object.contractAddressSalt !== null)
      ? FieldElement.fromPartial(object.contractAddressSalt)
      : undefined;
    message.classHash = (object.classHash !== undefined && object.classHash !== null)
      ? FieldElement.fromPartial(object.classHash)
      : undefined;
    return message;
  },
};

function createBaseDeclareTransaction(): DeclareTransaction {
  return { classHash: undefined, senderAddress: undefined };
}

export const DeclareTransaction = {
  encode(message: DeclareTransaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.classHash !== undefined) {
      FieldElement.encode(message.classHash, writer.uint32(10).fork()).ldelim();
    }
    if (message.senderAddress !== undefined) {
      FieldElement.encode(message.senderAddress, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeclareTransaction {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeclareTransaction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.classHash = FieldElement.decode(reader, reader.uint32());
          break;
        case 2:
          message.senderAddress = FieldElement.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): DeclareTransaction {
    return {
      classHash: isSet(object.classHash) ? FieldElement.fromJSON(object.classHash) : undefined,
      senderAddress: isSet(object.senderAddress) ? FieldElement.fromJSON(object.senderAddress) : undefined,
    };
  },

  toJSON(message: DeclareTransaction): unknown {
    const obj: any = {};
    message.classHash !== undefined &&
      (obj.classHash = message.classHash ? FieldElement.toJSON(message.classHash) : undefined);
    message.senderAddress !== undefined &&
      (obj.senderAddress = message.senderAddress ? FieldElement.toJSON(message.senderAddress) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<DeclareTransaction>): DeclareTransaction {
    const message = createBaseDeclareTransaction();
    message.classHash = (object.classHash !== undefined && object.classHash !== null)
      ? FieldElement.fromPartial(object.classHash)
      : undefined;
    message.senderAddress = (object.senderAddress !== undefined && object.senderAddress !== null)
      ? FieldElement.fromPartial(object.senderAddress)
      : undefined;
    return message;
  },
};

function createBaseL1HandlerTransaction(): L1HandlerTransaction {
  return { contractAddress: undefined, entryPointSelector: undefined, calldata: [] };
}

export const L1HandlerTransaction = {
  encode(message: L1HandlerTransaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.contractAddress !== undefined) {
      FieldElement.encode(message.contractAddress, writer.uint32(18).fork()).ldelim();
    }
    if (message.entryPointSelector !== undefined) {
      FieldElement.encode(message.entryPointSelector, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.calldata) {
      FieldElement.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): L1HandlerTransaction {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseL1HandlerTransaction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          message.contractAddress = FieldElement.decode(reader, reader.uint32());
          break;
        case 3:
          message.entryPointSelector = FieldElement.decode(reader, reader.uint32());
          break;
        case 4:
          message.calldata.push(FieldElement.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): L1HandlerTransaction {
    return {
      contractAddress: isSet(object.contractAddress) ? FieldElement.fromJSON(object.contractAddress) : undefined,
      entryPointSelector: isSet(object.entryPointSelector)
        ? FieldElement.fromJSON(object.entryPointSelector)
        : undefined,
      calldata: Array.isArray(object?.calldata) ? object.calldata.map((e: any) => FieldElement.fromJSON(e)) : [],
    };
  },

  toJSON(message: L1HandlerTransaction): unknown {
    const obj: any = {};
    message.contractAddress !== undefined &&
      (obj.contractAddress = message.contractAddress ? FieldElement.toJSON(message.contractAddress) : undefined);
    message.entryPointSelector !== undefined &&
      (obj.entryPointSelector = message.entryPointSelector
        ? FieldElement.toJSON(message.entryPointSelector)
        : undefined);
    if (message.calldata) {
      obj.calldata = message.calldata.map((e) => e ? FieldElement.toJSON(e) : undefined);
    } else {
      obj.calldata = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<L1HandlerTransaction>): L1HandlerTransaction {
    const message = createBaseL1HandlerTransaction();
    message.contractAddress = (object.contractAddress !== undefined && object.contractAddress !== null)
      ? FieldElement.fromPartial(object.contractAddress)
      : undefined;
    message.entryPointSelector = (object.entryPointSelector !== undefined && object.entryPointSelector !== null)
      ? FieldElement.fromPartial(object.entryPointSelector)
      : undefined;
    message.calldata = object.calldata?.map((e) => FieldElement.fromPartial(e)) || [];
    return message;
  },
};

function createBaseDeployAccountTransaction(): DeployAccountTransaction {
  return { constructorCalldata: [], contractAddressSalt: undefined, classHash: undefined };
}

export const DeployAccountTransaction = {
  encode(message: DeployAccountTransaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.constructorCalldata) {
      FieldElement.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.contractAddressSalt !== undefined) {
      FieldElement.encode(message.contractAddressSalt, writer.uint32(26).fork()).ldelim();
    }
    if (message.classHash !== undefined) {
      FieldElement.encode(message.classHash, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeployAccountTransaction {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeployAccountTransaction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          message.constructorCalldata.push(FieldElement.decode(reader, reader.uint32()));
          break;
        case 3:
          message.contractAddressSalt = FieldElement.decode(reader, reader.uint32());
          break;
        case 4:
          message.classHash = FieldElement.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): DeployAccountTransaction {
    return {
      constructorCalldata: Array.isArray(object?.constructorCalldata)
        ? object.constructorCalldata.map((e: any) => FieldElement.fromJSON(e))
        : [],
      contractAddressSalt: isSet(object.contractAddressSalt)
        ? FieldElement.fromJSON(object.contractAddressSalt)
        : undefined,
      classHash: isSet(object.classHash) ? FieldElement.fromJSON(object.classHash) : undefined,
    };
  },

  toJSON(message: DeployAccountTransaction): unknown {
    const obj: any = {};
    if (message.constructorCalldata) {
      obj.constructorCalldata = message.constructorCalldata.map((e) => e ? FieldElement.toJSON(e) : undefined);
    } else {
      obj.constructorCalldata = [];
    }
    message.contractAddressSalt !== undefined && (obj.contractAddressSalt = message.contractAddressSalt
      ? FieldElement.toJSON(message.contractAddressSalt)
      : undefined);
    message.classHash !== undefined &&
      (obj.classHash = message.classHash ? FieldElement.toJSON(message.classHash) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<DeployAccountTransaction>): DeployAccountTransaction {
    const message = createBaseDeployAccountTransaction();
    message.constructorCalldata = object.constructorCalldata?.map((e) => FieldElement.fromPartial(e)) || [];
    message.contractAddressSalt = (object.contractAddressSalt !== undefined && object.contractAddressSalt !== null)
      ? FieldElement.fromPartial(object.contractAddressSalt)
      : undefined;
    message.classHash = (object.classHash !== undefined && object.classHash !== null)
      ? FieldElement.fromPartial(object.classHash)
      : undefined;
    return message;
  },
};

function createBaseTransactionReceipt(): TransactionReceipt {
  return {
    transactionHash: undefined,
    transactionIndex: Long.UZERO,
    actualFee: undefined,
    l2ToL1Messages: [],
    events: [],
  };
}

export const TransactionReceipt = {
  encode(message: TransactionReceipt, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.transactionHash !== undefined) {
      FieldElement.encode(message.transactionHash, writer.uint32(10).fork()).ldelim();
    }
    if (!message.transactionIndex.isZero()) {
      writer.uint32(16).uint64(message.transactionIndex);
    }
    if (message.actualFee !== undefined) {
      FieldElement.encode(message.actualFee, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.l2ToL1Messages) {
      L2ToL1Message.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    for (const v of message.events) {
      Event.encode(v!, writer.uint32(42).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionReceipt {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionReceipt();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.transactionHash = FieldElement.decode(reader, reader.uint32());
          break;
        case 2:
          message.transactionIndex = reader.uint64() as Long;
          break;
        case 3:
          message.actualFee = FieldElement.decode(reader, reader.uint32());
          break;
        case 4:
          message.l2ToL1Messages.push(L2ToL1Message.decode(reader, reader.uint32()));
          break;
        case 5:
          message.events.push(Event.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): TransactionReceipt {
    return {
      transactionHash: isSet(object.transactionHash) ? FieldElement.fromJSON(object.transactionHash) : undefined,
      transactionIndex: isSet(object.transactionIndex) ? Long.fromValue(object.transactionIndex) : Long.UZERO,
      actualFee: isSet(object.actualFee) ? FieldElement.fromJSON(object.actualFee) : undefined,
      l2ToL1Messages: Array.isArray(object?.l2ToL1Messages)
        ? object.l2ToL1Messages.map((e: any) => L2ToL1Message.fromJSON(e))
        : [],
      events: Array.isArray(object?.events) ? object.events.map((e: any) => Event.fromJSON(e)) : [],
    };
  },

  toJSON(message: TransactionReceipt): unknown {
    const obj: any = {};
    message.transactionHash !== undefined &&
      (obj.transactionHash = message.transactionHash ? FieldElement.toJSON(message.transactionHash) : undefined);
    message.transactionIndex !== undefined &&
      (obj.transactionIndex = (message.transactionIndex || Long.UZERO).toString());
    message.actualFee !== undefined &&
      (obj.actualFee = message.actualFee ? FieldElement.toJSON(message.actualFee) : undefined);
    if (message.l2ToL1Messages) {
      obj.l2ToL1Messages = message.l2ToL1Messages.map((e) => e ? L2ToL1Message.toJSON(e) : undefined);
    } else {
      obj.l2ToL1Messages = [];
    }
    if (message.events) {
      obj.events = message.events.map((e) => e ? Event.toJSON(e) : undefined);
    } else {
      obj.events = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<TransactionReceipt>): TransactionReceipt {
    const message = createBaseTransactionReceipt();
    message.transactionHash = (object.transactionHash !== undefined && object.transactionHash !== null)
      ? FieldElement.fromPartial(object.transactionHash)
      : undefined;
    message.transactionIndex = (object.transactionIndex !== undefined && object.transactionIndex !== null)
      ? Long.fromValue(object.transactionIndex)
      : Long.UZERO;
    message.actualFee = (object.actualFee !== undefined && object.actualFee !== null)
      ? FieldElement.fromPartial(object.actualFee)
      : undefined;
    message.l2ToL1Messages = object.l2ToL1Messages?.map((e) => L2ToL1Message.fromPartial(e)) || [];
    message.events = object.events?.map((e) => Event.fromPartial(e)) || [];
    return message;
  },
};

function createBaseL2ToL1MessageWithTransaction(): L2ToL1MessageWithTransaction {
  return { transaction: undefined, receipt: undefined, message: undefined };
}

export const L2ToL1MessageWithTransaction = {
  encode(message: L2ToL1MessageWithTransaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.transaction !== undefined) {
      Transaction.encode(message.transaction, writer.uint32(10).fork()).ldelim();
    }
    if (message.receipt !== undefined) {
      TransactionReceipt.encode(message.receipt, writer.uint32(18).fork()).ldelim();
    }
    if (message.message !== undefined) {
      L2ToL1Message.encode(message.message, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): L2ToL1MessageWithTransaction {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseL2ToL1MessageWithTransaction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.transaction = Transaction.decode(reader, reader.uint32());
          break;
        case 2:
          message.receipt = TransactionReceipt.decode(reader, reader.uint32());
          break;
        case 3:
          message.message = L2ToL1Message.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): L2ToL1MessageWithTransaction {
    return {
      transaction: isSet(object.transaction) ? Transaction.fromJSON(object.transaction) : undefined,
      receipt: isSet(object.receipt) ? TransactionReceipt.fromJSON(object.receipt) : undefined,
      message: isSet(object.message) ? L2ToL1Message.fromJSON(object.message) : undefined,
    };
  },

  toJSON(message: L2ToL1MessageWithTransaction): unknown {
    const obj: any = {};
    message.transaction !== undefined &&
      (obj.transaction = message.transaction ? Transaction.toJSON(message.transaction) : undefined);
    message.receipt !== undefined &&
      (obj.receipt = message.receipt ? TransactionReceipt.toJSON(message.receipt) : undefined);
    message.message !== undefined &&
      (obj.message = message.message ? L2ToL1Message.toJSON(message.message) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<L2ToL1MessageWithTransaction>): L2ToL1MessageWithTransaction {
    const message = createBaseL2ToL1MessageWithTransaction();
    message.transaction = (object.transaction !== undefined && object.transaction !== null)
      ? Transaction.fromPartial(object.transaction)
      : undefined;
    message.receipt = (object.receipt !== undefined && object.receipt !== null)
      ? TransactionReceipt.fromPartial(object.receipt)
      : undefined;
    message.message = (object.message !== undefined && object.message !== null)
      ? L2ToL1Message.fromPartial(object.message)
      : undefined;
    return message;
  },
};

function createBaseL2ToL1Message(): L2ToL1Message {
  return { toAddress: undefined, payload: [] };
}

export const L2ToL1Message = {
  encode(message: L2ToL1Message, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.toAddress !== undefined) {
      FieldElement.encode(message.toAddress, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.payload) {
      FieldElement.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): L2ToL1Message {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseL2ToL1Message();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 3:
          message.toAddress = FieldElement.decode(reader, reader.uint32());
          break;
        case 4:
          message.payload.push(FieldElement.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): L2ToL1Message {
    return {
      toAddress: isSet(object.toAddress) ? FieldElement.fromJSON(object.toAddress) : undefined,
      payload: Array.isArray(object?.payload) ? object.payload.map((e: any) => FieldElement.fromJSON(e)) : [],
    };
  },

  toJSON(message: L2ToL1Message): unknown {
    const obj: any = {};
    message.toAddress !== undefined &&
      (obj.toAddress = message.toAddress ? FieldElement.toJSON(message.toAddress) : undefined);
    if (message.payload) {
      obj.payload = message.payload.map((e) => e ? FieldElement.toJSON(e) : undefined);
    } else {
      obj.payload = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<L2ToL1Message>): L2ToL1Message {
    const message = createBaseL2ToL1Message();
    message.toAddress = (object.toAddress !== undefined && object.toAddress !== null)
      ? FieldElement.fromPartial(object.toAddress)
      : undefined;
    message.payload = object.payload?.map((e) => FieldElement.fromPartial(e)) || [];
    return message;
  },
};

function createBaseEventWithTransaction(): EventWithTransaction {
  return { transaction: undefined, receipt: undefined, event: undefined };
}

export const EventWithTransaction = {
  encode(message: EventWithTransaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.transaction !== undefined) {
      Transaction.encode(message.transaction, writer.uint32(10).fork()).ldelim();
    }
    if (message.receipt !== undefined) {
      TransactionReceipt.encode(message.receipt, writer.uint32(18).fork()).ldelim();
    }
    if (message.event !== undefined) {
      Event.encode(message.event, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventWithTransaction {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventWithTransaction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.transaction = Transaction.decode(reader, reader.uint32());
          break;
        case 2:
          message.receipt = TransactionReceipt.decode(reader, reader.uint32());
          break;
        case 3:
          message.event = Event.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): EventWithTransaction {
    return {
      transaction: isSet(object.transaction) ? Transaction.fromJSON(object.transaction) : undefined,
      receipt: isSet(object.receipt) ? TransactionReceipt.fromJSON(object.receipt) : undefined,
      event: isSet(object.event) ? Event.fromJSON(object.event) : undefined,
    };
  },

  toJSON(message: EventWithTransaction): unknown {
    const obj: any = {};
    message.transaction !== undefined &&
      (obj.transaction = message.transaction ? Transaction.toJSON(message.transaction) : undefined);
    message.receipt !== undefined &&
      (obj.receipt = message.receipt ? TransactionReceipt.toJSON(message.receipt) : undefined);
    message.event !== undefined && (obj.event = message.event ? Event.toJSON(message.event) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<EventWithTransaction>): EventWithTransaction {
    const message = createBaseEventWithTransaction();
    message.transaction = (object.transaction !== undefined && object.transaction !== null)
      ? Transaction.fromPartial(object.transaction)
      : undefined;
    message.receipt = (object.receipt !== undefined && object.receipt !== null)
      ? TransactionReceipt.fromPartial(object.receipt)
      : undefined;
    message.event = (object.event !== undefined && object.event !== null) ? Event.fromPartial(object.event) : undefined;
    return message;
  },
};

function createBaseEvent(): Event {
  return { fromAddress: undefined, keys: [], data: [] };
}

export const Event = {
  encode(message: Event, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fromAddress !== undefined) {
      FieldElement.encode(message.fromAddress, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.keys) {
      FieldElement.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.data) {
      FieldElement.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Event {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEvent();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.fromAddress = FieldElement.decode(reader, reader.uint32());
          break;
        case 2:
          message.keys.push(FieldElement.decode(reader, reader.uint32()));
          break;
        case 3:
          message.data.push(FieldElement.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Event {
    return {
      fromAddress: isSet(object.fromAddress) ? FieldElement.fromJSON(object.fromAddress) : undefined,
      keys: Array.isArray(object?.keys) ? object.keys.map((e: any) => FieldElement.fromJSON(e)) : [],
      data: Array.isArray(object?.data) ? object.data.map((e: any) => FieldElement.fromJSON(e)) : [],
    };
  },

  toJSON(message: Event): unknown {
    const obj: any = {};
    message.fromAddress !== undefined &&
      (obj.fromAddress = message.fromAddress ? FieldElement.toJSON(message.fromAddress) : undefined);
    if (message.keys) {
      obj.keys = message.keys.map((e) => e ? FieldElement.toJSON(e) : undefined);
    } else {
      obj.keys = [];
    }
    if (message.data) {
      obj.data = message.data.map((e) => e ? FieldElement.toJSON(e) : undefined);
    } else {
      obj.data = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<Event>): Event {
    const message = createBaseEvent();
    message.fromAddress = (object.fromAddress !== undefined && object.fromAddress !== null)
      ? FieldElement.fromPartial(object.fromAddress)
      : undefined;
    message.keys = object.keys?.map((e) => FieldElement.fromPartial(e)) || [];
    message.data = object.data?.map((e) => FieldElement.fromPartial(e)) || [];
    return message;
  },
};

function createBaseStateUpdate(): StateUpdate {
  return { newRoot: undefined, oldRoot: undefined, stateDiff: undefined };
}

export const StateUpdate = {
  encode(message: StateUpdate, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.newRoot !== undefined) {
      FieldElement.encode(message.newRoot, writer.uint32(10).fork()).ldelim();
    }
    if (message.oldRoot !== undefined) {
      FieldElement.encode(message.oldRoot, writer.uint32(18).fork()).ldelim();
    }
    if (message.stateDiff !== undefined) {
      StateDiff.encode(message.stateDiff, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StateUpdate {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStateUpdate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.newRoot = FieldElement.decode(reader, reader.uint32());
          break;
        case 2:
          message.oldRoot = FieldElement.decode(reader, reader.uint32());
          break;
        case 3:
          message.stateDiff = StateDiff.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): StateUpdate {
    return {
      newRoot: isSet(object.newRoot) ? FieldElement.fromJSON(object.newRoot) : undefined,
      oldRoot: isSet(object.oldRoot) ? FieldElement.fromJSON(object.oldRoot) : undefined,
      stateDiff: isSet(object.stateDiff) ? StateDiff.fromJSON(object.stateDiff) : undefined,
    };
  },

  toJSON(message: StateUpdate): unknown {
    const obj: any = {};
    message.newRoot !== undefined && (obj.newRoot = message.newRoot ? FieldElement.toJSON(message.newRoot) : undefined);
    message.oldRoot !== undefined && (obj.oldRoot = message.oldRoot ? FieldElement.toJSON(message.oldRoot) : undefined);
    message.stateDiff !== undefined &&
      (obj.stateDiff = message.stateDiff ? StateDiff.toJSON(message.stateDiff) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<StateUpdate>): StateUpdate {
    const message = createBaseStateUpdate();
    message.newRoot = (object.newRoot !== undefined && object.newRoot !== null)
      ? FieldElement.fromPartial(object.newRoot)
      : undefined;
    message.oldRoot = (object.oldRoot !== undefined && object.oldRoot !== null)
      ? FieldElement.fromPartial(object.oldRoot)
      : undefined;
    message.stateDiff = (object.stateDiff !== undefined && object.stateDiff !== null)
      ? StateDiff.fromPartial(object.stateDiff)
      : undefined;
    return message;
  },
};

function createBaseStateDiff(): StateDiff {
  return { storageDiffs: [], declaredContracts: [], deployedContracts: [], nonces: [] };
}

export const StateDiff = {
  encode(message: StateDiff, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.storageDiffs) {
      StorageDiff.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.declaredContracts) {
      DeclaredContract.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.deployedContracts) {
      DeployedContract.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.nonces) {
      NonceUpdate.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StateDiff {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStateDiff();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.storageDiffs.push(StorageDiff.decode(reader, reader.uint32()));
          break;
        case 2:
          message.declaredContracts.push(DeclaredContract.decode(reader, reader.uint32()));
          break;
        case 3:
          message.deployedContracts.push(DeployedContract.decode(reader, reader.uint32()));
          break;
        case 4:
          message.nonces.push(NonceUpdate.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): StateDiff {
    return {
      storageDiffs: Array.isArray(object?.storageDiffs)
        ? object.storageDiffs.map((e: any) => StorageDiff.fromJSON(e))
        : [],
      declaredContracts: Array.isArray(object?.declaredContracts)
        ? object.declaredContracts.map((e: any) => DeclaredContract.fromJSON(e))
        : [],
      deployedContracts: Array.isArray(object?.deployedContracts)
        ? object.deployedContracts.map((e: any) => DeployedContract.fromJSON(e))
        : [],
      nonces: Array.isArray(object?.nonces) ? object.nonces.map((e: any) => NonceUpdate.fromJSON(e)) : [],
    };
  },

  toJSON(message: StateDiff): unknown {
    const obj: any = {};
    if (message.storageDiffs) {
      obj.storageDiffs = message.storageDiffs.map((e) => e ? StorageDiff.toJSON(e) : undefined);
    } else {
      obj.storageDiffs = [];
    }
    if (message.declaredContracts) {
      obj.declaredContracts = message.declaredContracts.map((e) => e ? DeclaredContract.toJSON(e) : undefined);
    } else {
      obj.declaredContracts = [];
    }
    if (message.deployedContracts) {
      obj.deployedContracts = message.deployedContracts.map((e) => e ? DeployedContract.toJSON(e) : undefined);
    } else {
      obj.deployedContracts = [];
    }
    if (message.nonces) {
      obj.nonces = message.nonces.map((e) => e ? NonceUpdate.toJSON(e) : undefined);
    } else {
      obj.nonces = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<StateDiff>): StateDiff {
    const message = createBaseStateDiff();
    message.storageDiffs = object.storageDiffs?.map((e) => StorageDiff.fromPartial(e)) || [];
    message.declaredContracts = object.declaredContracts?.map((e) => DeclaredContract.fromPartial(e)) || [];
    message.deployedContracts = object.deployedContracts?.map((e) => DeployedContract.fromPartial(e)) || [];
    message.nonces = object.nonces?.map((e) => NonceUpdate.fromPartial(e)) || [];
    return message;
  },
};

function createBaseStorageDiff(): StorageDiff {
  return { contractAddress: undefined, storageEntries: [] };
}

export const StorageDiff = {
  encode(message: StorageDiff, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.contractAddress !== undefined) {
      FieldElement.encode(message.contractAddress, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.storageEntries) {
      StorageEntry.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StorageDiff {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStorageDiff();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.contractAddress = FieldElement.decode(reader, reader.uint32());
          break;
        case 2:
          message.storageEntries.push(StorageEntry.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): StorageDiff {
    return {
      contractAddress: isSet(object.contractAddress) ? FieldElement.fromJSON(object.contractAddress) : undefined,
      storageEntries: Array.isArray(object?.storageEntries)
        ? object.storageEntries.map((e: any) => StorageEntry.fromJSON(e))
        : [],
    };
  },

  toJSON(message: StorageDiff): unknown {
    const obj: any = {};
    message.contractAddress !== undefined &&
      (obj.contractAddress = message.contractAddress ? FieldElement.toJSON(message.contractAddress) : undefined);
    if (message.storageEntries) {
      obj.storageEntries = message.storageEntries.map((e) => e ? StorageEntry.toJSON(e) : undefined);
    } else {
      obj.storageEntries = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<StorageDiff>): StorageDiff {
    const message = createBaseStorageDiff();
    message.contractAddress = (object.contractAddress !== undefined && object.contractAddress !== null)
      ? FieldElement.fromPartial(object.contractAddress)
      : undefined;
    message.storageEntries = object.storageEntries?.map((e) => StorageEntry.fromPartial(e)) || [];
    return message;
  },
};

function createBaseStorageEntry(): StorageEntry {
  return { key: undefined, value: undefined };
}

export const StorageEntry = {
  encode(message: StorageEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== undefined) {
      FieldElement.encode(message.key, writer.uint32(10).fork()).ldelim();
    }
    if (message.value !== undefined) {
      FieldElement.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StorageEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStorageEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = FieldElement.decode(reader, reader.uint32());
          break;
        case 2:
          message.value = FieldElement.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): StorageEntry {
    return {
      key: isSet(object.key) ? FieldElement.fromJSON(object.key) : undefined,
      value: isSet(object.value) ? FieldElement.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: StorageEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key ? FieldElement.toJSON(message.key) : undefined);
    message.value !== undefined && (obj.value = message.value ? FieldElement.toJSON(message.value) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<StorageEntry>): StorageEntry {
    const message = createBaseStorageEntry();
    message.key = (object.key !== undefined && object.key !== null) ? FieldElement.fromPartial(object.key) : undefined;
    message.value = (object.value !== undefined && object.value !== null)
      ? FieldElement.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseDeclaredContract(): DeclaredContract {
  return { classHash: undefined };
}

export const DeclaredContract = {
  encode(message: DeclaredContract, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.classHash !== undefined) {
      FieldElement.encode(message.classHash, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeclaredContract {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeclaredContract();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.classHash = FieldElement.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): DeclaredContract {
    return { classHash: isSet(object.classHash) ? FieldElement.fromJSON(object.classHash) : undefined };
  },

  toJSON(message: DeclaredContract): unknown {
    const obj: any = {};
    message.classHash !== undefined &&
      (obj.classHash = message.classHash ? FieldElement.toJSON(message.classHash) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<DeclaredContract>): DeclaredContract {
    const message = createBaseDeclaredContract();
    message.classHash = (object.classHash !== undefined && object.classHash !== null)
      ? FieldElement.fromPartial(object.classHash)
      : undefined;
    return message;
  },
};

function createBaseDeployedContract(): DeployedContract {
  return { contractAddress: undefined, classHash: undefined };
}

export const DeployedContract = {
  encode(message: DeployedContract, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.contractAddress !== undefined) {
      FieldElement.encode(message.contractAddress, writer.uint32(10).fork()).ldelim();
    }
    if (message.classHash !== undefined) {
      FieldElement.encode(message.classHash, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeployedContract {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeployedContract();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.contractAddress = FieldElement.decode(reader, reader.uint32());
          break;
        case 2:
          message.classHash = FieldElement.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): DeployedContract {
    return {
      contractAddress: isSet(object.contractAddress) ? FieldElement.fromJSON(object.contractAddress) : undefined,
      classHash: isSet(object.classHash) ? FieldElement.fromJSON(object.classHash) : undefined,
    };
  },

  toJSON(message: DeployedContract): unknown {
    const obj: any = {};
    message.contractAddress !== undefined &&
      (obj.contractAddress = message.contractAddress ? FieldElement.toJSON(message.contractAddress) : undefined);
    message.classHash !== undefined &&
      (obj.classHash = message.classHash ? FieldElement.toJSON(message.classHash) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<DeployedContract>): DeployedContract {
    const message = createBaseDeployedContract();
    message.contractAddress = (object.contractAddress !== undefined && object.contractAddress !== null)
      ? FieldElement.fromPartial(object.contractAddress)
      : undefined;
    message.classHash = (object.classHash !== undefined && object.classHash !== null)
      ? FieldElement.fromPartial(object.classHash)
      : undefined;
    return message;
  },
};

function createBaseNonceUpdate(): NonceUpdate {
  return { contractAddress: undefined, nonce: undefined };
}

export const NonceUpdate = {
  encode(message: NonceUpdate, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.contractAddress !== undefined) {
      FieldElement.encode(message.contractAddress, writer.uint32(10).fork()).ldelim();
    }
    if (message.nonce !== undefined) {
      FieldElement.encode(message.nonce, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): NonceUpdate {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseNonceUpdate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.contractAddress = FieldElement.decode(reader, reader.uint32());
          break;
        case 2:
          message.nonce = FieldElement.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): NonceUpdate {
    return {
      contractAddress: isSet(object.contractAddress) ? FieldElement.fromJSON(object.contractAddress) : undefined,
      nonce: isSet(object.nonce) ? FieldElement.fromJSON(object.nonce) : undefined,
    };
  },

  toJSON(message: NonceUpdate): unknown {
    const obj: any = {};
    message.contractAddress !== undefined &&
      (obj.contractAddress = message.contractAddress ? FieldElement.toJSON(message.contractAddress) : undefined);
    message.nonce !== undefined && (obj.nonce = message.nonce ? FieldElement.toJSON(message.nonce) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<NonceUpdate>): NonceUpdate {
    const message = createBaseNonceUpdate();
    message.contractAddress = (object.contractAddress !== undefined && object.contractAddress !== null)
      ? FieldElement.fromPartial(object.contractAddress)
      : undefined;
    message.nonce = (object.nonce !== undefined && object.nonce !== null)
      ? FieldElement.fromPartial(object.nonce)
      : undefined;
    return message;
  },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Long ? string | number | Long : T extends Array<infer U> ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

function toTimestamp(date: Date): Timestamp {
  const seconds = numberToLong(date.getTime() / 1_000);
  const nanos = (date.getTime() % 1_000) * 1_000_000;
  return { seconds, nanos };
}

function fromTimestamp(t: Timestamp): Date {
  let millis = t.seconds.toNumber() * 1_000;
  millis += t.nanos / 1_000_000;
  return new Date(millis);
}

function fromJsonTimestamp(o: any): Date {
  if (o instanceof Date) {
    return o;
  } else if (typeof o === "string") {
    return new Date(o);
  } else {
    return fromTimestamp(Timestamp.fromJSON(o));
  }
}

function numberToLong(number: number) {
  return Long.fromNumber(number);
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
