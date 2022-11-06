/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { Timestamp } from "./google/protobuf/timestamp";

export const protobufPackage = "apibara.starknet.v1alpha1";

/** # Apibara StarkNet Support */

/** Status of a transaction. */
export enum TransactionStatus {
  TRANSACTION_STATUS_UNSPECIFIED = 0,
  TRANSACTION_STATUS_RECEIVED = 1,
  TRANSACTION_STATUS_PENDING = 2,
  TRANSACTION_STATUS_ACCEPTED_ON_L2 = 3,
  TRANSACTION_STATUS_ACCEPTED_ON_L1 = 4,
  TRANSACTION_STATUS_REJECTED = 5,
  UNRECOGNIZED = -1,
}

export function transactionStatusFromJSON(object: any): TransactionStatus {
  switch (object) {
    case 0:
    case "TRANSACTION_STATUS_UNSPECIFIED":
      return TransactionStatus.TRANSACTION_STATUS_UNSPECIFIED;
    case 1:
    case "TRANSACTION_STATUS_RECEIVED":
      return TransactionStatus.TRANSACTION_STATUS_RECEIVED;
    case 2:
    case "TRANSACTION_STATUS_PENDING":
      return TransactionStatus.TRANSACTION_STATUS_PENDING;
    case 3:
    case "TRANSACTION_STATUS_ACCEPTED_ON_L2":
      return TransactionStatus.TRANSACTION_STATUS_ACCEPTED_ON_L2;
    case 4:
    case "TRANSACTION_STATUS_ACCEPTED_ON_L1":
      return TransactionStatus.TRANSACTION_STATUS_ACCEPTED_ON_L1;
    case 5:
    case "TRANSACTION_STATUS_REJECTED":
      return TransactionStatus.TRANSACTION_STATUS_REJECTED;
    case -1:
    case "UNRECOGNIZED":
    default:
      return TransactionStatus.UNRECOGNIZED;
  }
}

export function transactionStatusToJSON(object: TransactionStatus): string {
  switch (object) {
    case TransactionStatus.TRANSACTION_STATUS_UNSPECIFIED:
      return "TRANSACTION_STATUS_UNSPECIFIED";
    case TransactionStatus.TRANSACTION_STATUS_RECEIVED:
      return "TRANSACTION_STATUS_RECEIVED";
    case TransactionStatus.TRANSACTION_STATUS_PENDING:
      return "TRANSACTION_STATUS_PENDING";
    case TransactionStatus.TRANSACTION_STATUS_ACCEPTED_ON_L2:
      return "TRANSACTION_STATUS_ACCEPTED_ON_L2";
    case TransactionStatus.TRANSACTION_STATUS_ACCEPTED_ON_L1:
      return "TRANSACTION_STATUS_ACCEPTED_ON_L1";
    case TransactionStatus.TRANSACTION_STATUS_REJECTED:
      return "TRANSACTION_STATUS_REJECTED";
    case TransactionStatus.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

/** A StarkNet block. */
export interface Block {
  blockHash: BlockHash | undefined;
  parentBlockHash: BlockHash | undefined;
  blockNumber: number;
  sequencerAddress: Uint8Array;
  stateRoot: Uint8Array;
  gasPrice: Uint8Array;
  timestamp: Date | undefined;
  starknetVersion: string;
  transactions: Transaction[];
  transactionReceipts: TransactionReceipt[];
}

/** The hash of a StarkNet block. */
export interface BlockHash {
  hash: Uint8Array;
}

export interface Transaction {
  invoke: InvokeTransaction | undefined;
  deploy: DeployTransaction | undefined;
  declare: DeclareTransaction | undefined;
  l1Handler: L1HandlerTransaction | undefined;
  deployAccount: DeployAccountTransaction | undefined;
}

export interface TransactionCommon {
  hash: Uint8Array;
  maxFee: Uint8Array;
  signature: Uint8Array[];
  nonce: Uint8Array;
  version: Uint8Array;
}

export interface InvokeTransaction {
  common: TransactionCommon | undefined;
  contractAddress: Uint8Array;
  entryPointSelector: Uint8Array;
  calldata: Uint8Array[];
}

export interface DeclareTransaction {
  common: TransactionCommon | undefined;
  classHash: Uint8Array;
  senderAddress: Uint8Array;
}

export interface DeployTransaction {
  common: TransactionCommon | undefined;
  constructorCalldata: Uint8Array[];
  contractAddress: Uint8Array;
  contractAddressSalt: Uint8Array;
  classHash: Uint8Array;
}

export interface L1HandlerTransaction {
  common: TransactionCommon | undefined;
  contractAddress: Uint8Array;
  entryPointSelector: Uint8Array;
  calldata: Uint8Array[];
}

export interface DeployAccountTransaction {
  common: TransactionCommon | undefined;
  constructorCalldata: Uint8Array[];
  contractAddress: Uint8Array;
  contractAddressSalt: Uint8Array;
  classHash: Uint8Array;
}

export interface TransactionReceipt {
  transactionHash: Uint8Array;
  transactionIndex: number;
  actualFee: Uint8Array;
  executionResources: ExecutionResources | undefined;
  l1ToL2ConsumedMessage: L1ToL2Message | undefined;
  l2ToL1Messages: L2ToL1Message[];
  events: Event[];
}

export interface ExecutionResources {
  nSteps: number;
  nMemoryHoles: number;
  builtinInstanceCounter: BuiltinInstanceCounter | undefined;
}

export interface BuiltinInstanceCounter {
  pedersenBuiltin?: number | undefined;
  rangeCheckBuiltin?: number | undefined;
  bitwiseBuiltin?: number | undefined;
  outputBuiltin?: number | undefined;
  ecdsaBuiltin?: number | undefined;
  ecOpBuiltin?: number | undefined;
}

export interface L1ToL2Message {
  fromAddress: Uint8Array;
  toAddress: Uint8Array;
  selector: Uint8Array;
  payload: Uint8Array[];
  nonce: Uint8Array;
}

export interface L2ToL1Message {
  fromAddress: Uint8Array;
  toAddress: Uint8Array;
  payload: Uint8Array[];
}

export interface Event {
  fromAddress: Uint8Array;
  keys: Uint8Array[];
  data: Uint8Array[];
}

function createBaseBlock(): Block {
  return {
    blockHash: undefined,
    parentBlockHash: undefined,
    blockNumber: 0,
    sequencerAddress: new Uint8Array(),
    stateRoot: new Uint8Array(),
    gasPrice: new Uint8Array(),
    timestamp: undefined,
    starknetVersion: "",
    transactions: [],
    transactionReceipts: [],
  };
}

export const Block = {
  encode(message: Block, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.blockHash !== undefined) {
      BlockHash.encode(message.blockHash, writer.uint32(10).fork()).ldelim();
    }
    if (message.parentBlockHash !== undefined) {
      BlockHash.encode(message.parentBlockHash, writer.uint32(18).fork()).ldelim();
    }
    if (message.blockNumber !== 0) {
      writer.uint32(24).uint64(message.blockNumber);
    }
    if (message.sequencerAddress.length !== 0) {
      writer.uint32(34).bytes(message.sequencerAddress);
    }
    if (message.stateRoot.length !== 0) {
      writer.uint32(42).bytes(message.stateRoot);
    }
    if (message.gasPrice.length !== 0) {
      writer.uint32(50).bytes(message.gasPrice);
    }
    if (message.timestamp !== undefined) {
      Timestamp.encode(toTimestamp(message.timestamp), writer.uint32(58).fork()).ldelim();
    }
    if (message.starknetVersion !== "") {
      writer.uint32(66).string(message.starknetVersion);
    }
    for (const v of message.transactions) {
      Transaction.encode(v!, writer.uint32(74).fork()).ldelim();
    }
    for (const v of message.transactionReceipts) {
      TransactionReceipt.encode(v!, writer.uint32(82).fork()).ldelim();
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
          message.blockHash = BlockHash.decode(reader, reader.uint32());
          break;
        case 2:
          message.parentBlockHash = BlockHash.decode(reader, reader.uint32());
          break;
        case 3:
          message.blockNumber = longToNumber(reader.uint64() as Long);
          break;
        case 4:
          message.sequencerAddress = reader.bytes();
          break;
        case 5:
          message.stateRoot = reader.bytes();
          break;
        case 6:
          message.gasPrice = reader.bytes();
          break;
        case 7:
          message.timestamp = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          break;
        case 8:
          message.starknetVersion = reader.string();
          break;
        case 9:
          message.transactions.push(Transaction.decode(reader, reader.uint32()));
          break;
        case 10:
          message.transactionReceipts.push(TransactionReceipt.decode(reader, reader.uint32()));
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
      blockHash: isSet(object.blockHash) ? BlockHash.fromJSON(object.blockHash) : undefined,
      parentBlockHash: isSet(object.parentBlockHash) ? BlockHash.fromJSON(object.parentBlockHash) : undefined,
      blockNumber: isSet(object.blockNumber) ? Number(object.blockNumber) : 0,
      sequencerAddress: isSet(object.sequencerAddress) ? bytesFromBase64(object.sequencerAddress) : new Uint8Array(),
      stateRoot: isSet(object.stateRoot) ? bytesFromBase64(object.stateRoot) : new Uint8Array(),
      gasPrice: isSet(object.gasPrice) ? bytesFromBase64(object.gasPrice) : new Uint8Array(),
      timestamp: isSet(object.timestamp) ? fromJsonTimestamp(object.timestamp) : undefined,
      starknetVersion: isSet(object.starknetVersion) ? String(object.starknetVersion) : "",
      transactions: Array.isArray(object?.transactions)
        ? object.transactions.map((e: any) => Transaction.fromJSON(e))
        : [],
      transactionReceipts: Array.isArray(object?.transactionReceipts)
        ? object.transactionReceipts.map((e: any) => TransactionReceipt.fromJSON(e))
        : [],
    };
  },

  toJSON(message: Block): unknown {
    const obj: any = {};
    message.blockHash !== undefined &&
      (obj.blockHash = message.blockHash ? BlockHash.toJSON(message.blockHash) : undefined);
    message.parentBlockHash !== undefined &&
      (obj.parentBlockHash = message.parentBlockHash ? BlockHash.toJSON(message.parentBlockHash) : undefined);
    message.blockNumber !== undefined && (obj.blockNumber = Math.round(message.blockNumber));
    message.sequencerAddress !== undefined &&
      (obj.sequencerAddress = base64FromBytes(
        message.sequencerAddress !== undefined ? message.sequencerAddress : new Uint8Array(),
      ));
    message.stateRoot !== undefined &&
      (obj.stateRoot = base64FromBytes(message.stateRoot !== undefined ? message.stateRoot : new Uint8Array()));
    message.gasPrice !== undefined &&
      (obj.gasPrice = base64FromBytes(message.gasPrice !== undefined ? message.gasPrice : new Uint8Array()));
    message.timestamp !== undefined && (obj.timestamp = message.timestamp.toISOString());
    message.starknetVersion !== undefined && (obj.starknetVersion = message.starknetVersion);
    if (message.transactions) {
      obj.transactions = message.transactions.map((e) => e ? Transaction.toJSON(e) : undefined);
    } else {
      obj.transactions = [];
    }
    if (message.transactionReceipts) {
      obj.transactionReceipts = message.transactionReceipts.map((e) => e ? TransactionReceipt.toJSON(e) : undefined);
    } else {
      obj.transactionReceipts = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Block>, I>>(object: I): Block {
    const message = createBaseBlock();
    message.blockHash = (object.blockHash !== undefined && object.blockHash !== null)
      ? BlockHash.fromPartial(object.blockHash)
      : undefined;
    message.parentBlockHash = (object.parentBlockHash !== undefined && object.parentBlockHash !== null)
      ? BlockHash.fromPartial(object.parentBlockHash)
      : undefined;
    message.blockNumber = object.blockNumber ?? 0;
    message.sequencerAddress = object.sequencerAddress ?? new Uint8Array();
    message.stateRoot = object.stateRoot ?? new Uint8Array();
    message.gasPrice = object.gasPrice ?? new Uint8Array();
    message.timestamp = object.timestamp ?? undefined;
    message.starknetVersion = object.starknetVersion ?? "";
    message.transactions = object.transactions?.map((e) => Transaction.fromPartial(e)) || [];
    message.transactionReceipts = object.transactionReceipts?.map((e) => TransactionReceipt.fromPartial(e)) || [];
    return message;
  },
};

function createBaseBlockHash(): BlockHash {
  return { hash: new Uint8Array() };
}

export const BlockHash = {
  encode(message: BlockHash, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.hash.length !== 0) {
      writer.uint32(10).bytes(message.hash);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BlockHash {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBlockHash();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.hash = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): BlockHash {
    return { hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array() };
  },

  toJSON(message: BlockHash): unknown {
    const obj: any = {};
    message.hash !== undefined &&
      (obj.hash = base64FromBytes(message.hash !== undefined ? message.hash : new Uint8Array()));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<BlockHash>, I>>(object: I): BlockHash {
    const message = createBaseBlockHash();
    message.hash = object.hash ?? new Uint8Array();
    return message;
  },
};

function createBaseTransaction(): Transaction {
  return { invoke: undefined, deploy: undefined, declare: undefined, l1Handler: undefined, deployAccount: undefined };
}

export const Transaction = {
  encode(message: Transaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.invoke !== undefined) {
      InvokeTransaction.encode(message.invoke, writer.uint32(10).fork()).ldelim();
    }
    if (message.deploy !== undefined) {
      DeployTransaction.encode(message.deploy, writer.uint32(18).fork()).ldelim();
    }
    if (message.declare !== undefined) {
      DeclareTransaction.encode(message.declare, writer.uint32(26).fork()).ldelim();
    }
    if (message.l1Handler !== undefined) {
      L1HandlerTransaction.encode(message.l1Handler, writer.uint32(34).fork()).ldelim();
    }
    if (message.deployAccount !== undefined) {
      DeployAccountTransaction.encode(message.deployAccount, writer.uint32(42).fork()).ldelim();
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
          message.invoke = InvokeTransaction.decode(reader, reader.uint32());
          break;
        case 2:
          message.deploy = DeployTransaction.decode(reader, reader.uint32());
          break;
        case 3:
          message.declare = DeclareTransaction.decode(reader, reader.uint32());
          break;
        case 4:
          message.l1Handler = L1HandlerTransaction.decode(reader, reader.uint32());
          break;
        case 5:
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
      invoke: isSet(object.invoke) ? InvokeTransaction.fromJSON(object.invoke) : undefined,
      deploy: isSet(object.deploy) ? DeployTransaction.fromJSON(object.deploy) : undefined,
      declare: isSet(object.declare) ? DeclareTransaction.fromJSON(object.declare) : undefined,
      l1Handler: isSet(object.l1Handler) ? L1HandlerTransaction.fromJSON(object.l1Handler) : undefined,
      deployAccount: isSet(object.deployAccount) ? DeployAccountTransaction.fromJSON(object.deployAccount) : undefined,
    };
  },

  toJSON(message: Transaction): unknown {
    const obj: any = {};
    message.invoke !== undefined &&
      (obj.invoke = message.invoke ? InvokeTransaction.toJSON(message.invoke) : undefined);
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

  fromPartial<I extends Exact<DeepPartial<Transaction>, I>>(object: I): Transaction {
    const message = createBaseTransaction();
    message.invoke = (object.invoke !== undefined && object.invoke !== null)
      ? InvokeTransaction.fromPartial(object.invoke)
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

function createBaseTransactionCommon(): TransactionCommon {
  return {
    hash: new Uint8Array(),
    maxFee: new Uint8Array(),
    signature: [],
    nonce: new Uint8Array(),
    version: new Uint8Array(),
  };
}

export const TransactionCommon = {
  encode(message: TransactionCommon, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.hash.length !== 0) {
      writer.uint32(10).bytes(message.hash);
    }
    if (message.maxFee.length !== 0) {
      writer.uint32(18).bytes(message.maxFee);
    }
    for (const v of message.signature) {
      writer.uint32(26).bytes(v!);
    }
    if (message.nonce.length !== 0) {
      writer.uint32(34).bytes(message.nonce);
    }
    if (message.version.length !== 0) {
      writer.uint32(42).bytes(message.version);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionCommon {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionCommon();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.hash = reader.bytes();
          break;
        case 2:
          message.maxFee = reader.bytes();
          break;
        case 3:
          message.signature.push(reader.bytes());
          break;
        case 4:
          message.nonce = reader.bytes();
          break;
        case 5:
          message.version = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): TransactionCommon {
    return {
      hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(),
      maxFee: isSet(object.maxFee) ? bytesFromBase64(object.maxFee) : new Uint8Array(),
      signature: Array.isArray(object?.signature) ? object.signature.map((e: any) => bytesFromBase64(e)) : [],
      nonce: isSet(object.nonce) ? bytesFromBase64(object.nonce) : new Uint8Array(),
      version: isSet(object.version) ? bytesFromBase64(object.version) : new Uint8Array(),
    };
  },

  toJSON(message: TransactionCommon): unknown {
    const obj: any = {};
    message.hash !== undefined &&
      (obj.hash = base64FromBytes(message.hash !== undefined ? message.hash : new Uint8Array()));
    message.maxFee !== undefined &&
      (obj.maxFee = base64FromBytes(message.maxFee !== undefined ? message.maxFee : new Uint8Array()));
    if (message.signature) {
      obj.signature = message.signature.map((e) => base64FromBytes(e !== undefined ? e : new Uint8Array()));
    } else {
      obj.signature = [];
    }
    message.nonce !== undefined &&
      (obj.nonce = base64FromBytes(message.nonce !== undefined ? message.nonce : new Uint8Array()));
    message.version !== undefined &&
      (obj.version = base64FromBytes(message.version !== undefined ? message.version : new Uint8Array()));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<TransactionCommon>, I>>(object: I): TransactionCommon {
    const message = createBaseTransactionCommon();
    message.hash = object.hash ?? new Uint8Array();
    message.maxFee = object.maxFee ?? new Uint8Array();
    message.signature = object.signature?.map((e) => e) || [];
    message.nonce = object.nonce ?? new Uint8Array();
    message.version = object.version ?? new Uint8Array();
    return message;
  },
};

function createBaseInvokeTransaction(): InvokeTransaction {
  return { common: undefined, contractAddress: new Uint8Array(), entryPointSelector: new Uint8Array(), calldata: [] };
}

export const InvokeTransaction = {
  encode(message: InvokeTransaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.common !== undefined) {
      TransactionCommon.encode(message.common, writer.uint32(10).fork()).ldelim();
    }
    if (message.contractAddress.length !== 0) {
      writer.uint32(18).bytes(message.contractAddress);
    }
    if (message.entryPointSelector.length !== 0) {
      writer.uint32(26).bytes(message.entryPointSelector);
    }
    for (const v of message.calldata) {
      writer.uint32(34).bytes(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): InvokeTransaction {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInvokeTransaction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.common = TransactionCommon.decode(reader, reader.uint32());
          break;
        case 2:
          message.contractAddress = reader.bytes();
          break;
        case 3:
          message.entryPointSelector = reader.bytes();
          break;
        case 4:
          message.calldata.push(reader.bytes());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): InvokeTransaction {
    return {
      common: isSet(object.common) ? TransactionCommon.fromJSON(object.common) : undefined,
      contractAddress: isSet(object.contractAddress) ? bytesFromBase64(object.contractAddress) : new Uint8Array(),
      entryPointSelector: isSet(object.entryPointSelector)
        ? bytesFromBase64(object.entryPointSelector)
        : new Uint8Array(),
      calldata: Array.isArray(object?.calldata) ? object.calldata.map((e: any) => bytesFromBase64(e)) : [],
    };
  },

  toJSON(message: InvokeTransaction): unknown {
    const obj: any = {};
    message.common !== undefined &&
      (obj.common = message.common ? TransactionCommon.toJSON(message.common) : undefined);
    message.contractAddress !== undefined &&
      (obj.contractAddress = base64FromBytes(
        message.contractAddress !== undefined ? message.contractAddress : new Uint8Array(),
      ));
    message.entryPointSelector !== undefined &&
      (obj.entryPointSelector = base64FromBytes(
        message.entryPointSelector !== undefined ? message.entryPointSelector : new Uint8Array(),
      ));
    if (message.calldata) {
      obj.calldata = message.calldata.map((e) => base64FromBytes(e !== undefined ? e : new Uint8Array()));
    } else {
      obj.calldata = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<InvokeTransaction>, I>>(object: I): InvokeTransaction {
    const message = createBaseInvokeTransaction();
    message.common = (object.common !== undefined && object.common !== null)
      ? TransactionCommon.fromPartial(object.common)
      : undefined;
    message.contractAddress = object.contractAddress ?? new Uint8Array();
    message.entryPointSelector = object.entryPointSelector ?? new Uint8Array();
    message.calldata = object.calldata?.map((e) => e) || [];
    return message;
  },
};

function createBaseDeclareTransaction(): DeclareTransaction {
  return { common: undefined, classHash: new Uint8Array(), senderAddress: new Uint8Array() };
}

export const DeclareTransaction = {
  encode(message: DeclareTransaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.common !== undefined) {
      TransactionCommon.encode(message.common, writer.uint32(10).fork()).ldelim();
    }
    if (message.classHash.length !== 0) {
      writer.uint32(18).bytes(message.classHash);
    }
    if (message.senderAddress.length !== 0) {
      writer.uint32(26).bytes(message.senderAddress);
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
          message.common = TransactionCommon.decode(reader, reader.uint32());
          break;
        case 2:
          message.classHash = reader.bytes();
          break;
        case 3:
          message.senderAddress = reader.bytes();
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
      common: isSet(object.common) ? TransactionCommon.fromJSON(object.common) : undefined,
      classHash: isSet(object.classHash) ? bytesFromBase64(object.classHash) : new Uint8Array(),
      senderAddress: isSet(object.senderAddress) ? bytesFromBase64(object.senderAddress) : new Uint8Array(),
    };
  },

  toJSON(message: DeclareTransaction): unknown {
    const obj: any = {};
    message.common !== undefined &&
      (obj.common = message.common ? TransactionCommon.toJSON(message.common) : undefined);
    message.classHash !== undefined &&
      (obj.classHash = base64FromBytes(message.classHash !== undefined ? message.classHash : new Uint8Array()));
    message.senderAddress !== undefined &&
      (obj.senderAddress = base64FromBytes(
        message.senderAddress !== undefined ? message.senderAddress : new Uint8Array(),
      ));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DeclareTransaction>, I>>(object: I): DeclareTransaction {
    const message = createBaseDeclareTransaction();
    message.common = (object.common !== undefined && object.common !== null)
      ? TransactionCommon.fromPartial(object.common)
      : undefined;
    message.classHash = object.classHash ?? new Uint8Array();
    message.senderAddress = object.senderAddress ?? new Uint8Array();
    return message;
  },
};

function createBaseDeployTransaction(): DeployTransaction {
  return {
    common: undefined,
    constructorCalldata: [],
    contractAddress: new Uint8Array(),
    contractAddressSalt: new Uint8Array(),
    classHash: new Uint8Array(),
  };
}

export const DeployTransaction = {
  encode(message: DeployTransaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.common !== undefined) {
      TransactionCommon.encode(message.common, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.constructorCalldata) {
      writer.uint32(18).bytes(v!);
    }
    if (message.contractAddress.length !== 0) {
      writer.uint32(26).bytes(message.contractAddress);
    }
    if (message.contractAddressSalt.length !== 0) {
      writer.uint32(34).bytes(message.contractAddressSalt);
    }
    if (message.classHash.length !== 0) {
      writer.uint32(42).bytes(message.classHash);
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
        case 1:
          message.common = TransactionCommon.decode(reader, reader.uint32());
          break;
        case 2:
          message.constructorCalldata.push(reader.bytes());
          break;
        case 3:
          message.contractAddress = reader.bytes();
          break;
        case 4:
          message.contractAddressSalt = reader.bytes();
          break;
        case 5:
          message.classHash = reader.bytes();
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
      common: isSet(object.common) ? TransactionCommon.fromJSON(object.common) : undefined,
      constructorCalldata: Array.isArray(object?.constructorCalldata)
        ? object.constructorCalldata.map((e: any) => bytesFromBase64(e))
        : [],
      contractAddress: isSet(object.contractAddress) ? bytesFromBase64(object.contractAddress) : new Uint8Array(),
      contractAddressSalt: isSet(object.contractAddressSalt)
        ? bytesFromBase64(object.contractAddressSalt)
        : new Uint8Array(),
      classHash: isSet(object.classHash) ? bytesFromBase64(object.classHash) : new Uint8Array(),
    };
  },

  toJSON(message: DeployTransaction): unknown {
    const obj: any = {};
    message.common !== undefined &&
      (obj.common = message.common ? TransactionCommon.toJSON(message.common) : undefined);
    if (message.constructorCalldata) {
      obj.constructorCalldata = message.constructorCalldata.map((e) =>
        base64FromBytes(e !== undefined ? e : new Uint8Array())
      );
    } else {
      obj.constructorCalldata = [];
    }
    message.contractAddress !== undefined &&
      (obj.contractAddress = base64FromBytes(
        message.contractAddress !== undefined ? message.contractAddress : new Uint8Array(),
      ));
    message.contractAddressSalt !== undefined &&
      (obj.contractAddressSalt = base64FromBytes(
        message.contractAddressSalt !== undefined ? message.contractAddressSalt : new Uint8Array(),
      ));
    message.classHash !== undefined &&
      (obj.classHash = base64FromBytes(message.classHash !== undefined ? message.classHash : new Uint8Array()));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DeployTransaction>, I>>(object: I): DeployTransaction {
    const message = createBaseDeployTransaction();
    message.common = (object.common !== undefined && object.common !== null)
      ? TransactionCommon.fromPartial(object.common)
      : undefined;
    message.constructorCalldata = object.constructorCalldata?.map((e) => e) || [];
    message.contractAddress = object.contractAddress ?? new Uint8Array();
    message.contractAddressSalt = object.contractAddressSalt ?? new Uint8Array();
    message.classHash = object.classHash ?? new Uint8Array();
    return message;
  },
};

function createBaseL1HandlerTransaction(): L1HandlerTransaction {
  return { common: undefined, contractAddress: new Uint8Array(), entryPointSelector: new Uint8Array(), calldata: [] };
}

export const L1HandlerTransaction = {
  encode(message: L1HandlerTransaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.common !== undefined) {
      TransactionCommon.encode(message.common, writer.uint32(10).fork()).ldelim();
    }
    if (message.contractAddress.length !== 0) {
      writer.uint32(18).bytes(message.contractAddress);
    }
    if (message.entryPointSelector.length !== 0) {
      writer.uint32(26).bytes(message.entryPointSelector);
    }
    for (const v of message.calldata) {
      writer.uint32(34).bytes(v!);
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
        case 1:
          message.common = TransactionCommon.decode(reader, reader.uint32());
          break;
        case 2:
          message.contractAddress = reader.bytes();
          break;
        case 3:
          message.entryPointSelector = reader.bytes();
          break;
        case 4:
          message.calldata.push(reader.bytes());
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
      common: isSet(object.common) ? TransactionCommon.fromJSON(object.common) : undefined,
      contractAddress: isSet(object.contractAddress) ? bytesFromBase64(object.contractAddress) : new Uint8Array(),
      entryPointSelector: isSet(object.entryPointSelector)
        ? bytesFromBase64(object.entryPointSelector)
        : new Uint8Array(),
      calldata: Array.isArray(object?.calldata) ? object.calldata.map((e: any) => bytesFromBase64(e)) : [],
    };
  },

  toJSON(message: L1HandlerTransaction): unknown {
    const obj: any = {};
    message.common !== undefined &&
      (obj.common = message.common ? TransactionCommon.toJSON(message.common) : undefined);
    message.contractAddress !== undefined &&
      (obj.contractAddress = base64FromBytes(
        message.contractAddress !== undefined ? message.contractAddress : new Uint8Array(),
      ));
    message.entryPointSelector !== undefined &&
      (obj.entryPointSelector = base64FromBytes(
        message.entryPointSelector !== undefined ? message.entryPointSelector : new Uint8Array(),
      ));
    if (message.calldata) {
      obj.calldata = message.calldata.map((e) => base64FromBytes(e !== undefined ? e : new Uint8Array()));
    } else {
      obj.calldata = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<L1HandlerTransaction>, I>>(object: I): L1HandlerTransaction {
    const message = createBaseL1HandlerTransaction();
    message.common = (object.common !== undefined && object.common !== null)
      ? TransactionCommon.fromPartial(object.common)
      : undefined;
    message.contractAddress = object.contractAddress ?? new Uint8Array();
    message.entryPointSelector = object.entryPointSelector ?? new Uint8Array();
    message.calldata = object.calldata?.map((e) => e) || [];
    return message;
  },
};

function createBaseDeployAccountTransaction(): DeployAccountTransaction {
  return {
    common: undefined,
    constructorCalldata: [],
    contractAddress: new Uint8Array(),
    contractAddressSalt: new Uint8Array(),
    classHash: new Uint8Array(),
  };
}

export const DeployAccountTransaction = {
  encode(message: DeployAccountTransaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.common !== undefined) {
      TransactionCommon.encode(message.common, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.constructorCalldata) {
      writer.uint32(18).bytes(v!);
    }
    if (message.contractAddress.length !== 0) {
      writer.uint32(26).bytes(message.contractAddress);
    }
    if (message.contractAddressSalt.length !== 0) {
      writer.uint32(34).bytes(message.contractAddressSalt);
    }
    if (message.classHash.length !== 0) {
      writer.uint32(42).bytes(message.classHash);
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
        case 1:
          message.common = TransactionCommon.decode(reader, reader.uint32());
          break;
        case 2:
          message.constructorCalldata.push(reader.bytes());
          break;
        case 3:
          message.contractAddress = reader.bytes();
          break;
        case 4:
          message.contractAddressSalt = reader.bytes();
          break;
        case 5:
          message.classHash = reader.bytes();
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
      common: isSet(object.common) ? TransactionCommon.fromJSON(object.common) : undefined,
      constructorCalldata: Array.isArray(object?.constructorCalldata)
        ? object.constructorCalldata.map((e: any) => bytesFromBase64(e))
        : [],
      contractAddress: isSet(object.contractAddress) ? bytesFromBase64(object.contractAddress) : new Uint8Array(),
      contractAddressSalt: isSet(object.contractAddressSalt)
        ? bytesFromBase64(object.contractAddressSalt)
        : new Uint8Array(),
      classHash: isSet(object.classHash) ? bytesFromBase64(object.classHash) : new Uint8Array(),
    };
  },

  toJSON(message: DeployAccountTransaction): unknown {
    const obj: any = {};
    message.common !== undefined &&
      (obj.common = message.common ? TransactionCommon.toJSON(message.common) : undefined);
    if (message.constructorCalldata) {
      obj.constructorCalldata = message.constructorCalldata.map((e) =>
        base64FromBytes(e !== undefined ? e : new Uint8Array())
      );
    } else {
      obj.constructorCalldata = [];
    }
    message.contractAddress !== undefined &&
      (obj.contractAddress = base64FromBytes(
        message.contractAddress !== undefined ? message.contractAddress : new Uint8Array(),
      ));
    message.contractAddressSalt !== undefined &&
      (obj.contractAddressSalt = base64FromBytes(
        message.contractAddressSalt !== undefined ? message.contractAddressSalt : new Uint8Array(),
      ));
    message.classHash !== undefined &&
      (obj.classHash = base64FromBytes(message.classHash !== undefined ? message.classHash : new Uint8Array()));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DeployAccountTransaction>, I>>(object: I): DeployAccountTransaction {
    const message = createBaseDeployAccountTransaction();
    message.common = (object.common !== undefined && object.common !== null)
      ? TransactionCommon.fromPartial(object.common)
      : undefined;
    message.constructorCalldata = object.constructorCalldata?.map((e) => e) || [];
    message.contractAddress = object.contractAddress ?? new Uint8Array();
    message.contractAddressSalt = object.contractAddressSalt ?? new Uint8Array();
    message.classHash = object.classHash ?? new Uint8Array();
    return message;
  },
};

function createBaseTransactionReceipt(): TransactionReceipt {
  return {
    transactionHash: new Uint8Array(),
    transactionIndex: 0,
    actualFee: new Uint8Array(),
    executionResources: undefined,
    l1ToL2ConsumedMessage: undefined,
    l2ToL1Messages: [],
    events: [],
  };
}

export const TransactionReceipt = {
  encode(message: TransactionReceipt, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.transactionHash.length !== 0) {
      writer.uint32(10).bytes(message.transactionHash);
    }
    if (message.transactionIndex !== 0) {
      writer.uint32(16).uint64(message.transactionIndex);
    }
    if (message.actualFee.length !== 0) {
      writer.uint32(26).bytes(message.actualFee);
    }
    if (message.executionResources !== undefined) {
      ExecutionResources.encode(message.executionResources, writer.uint32(34).fork()).ldelim();
    }
    if (message.l1ToL2ConsumedMessage !== undefined) {
      L1ToL2Message.encode(message.l1ToL2ConsumedMessage, writer.uint32(42).fork()).ldelim();
    }
    for (const v of message.l2ToL1Messages) {
      L2ToL1Message.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    for (const v of message.events) {
      Event.encode(v!, writer.uint32(58).fork()).ldelim();
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
          message.transactionHash = reader.bytes();
          break;
        case 2:
          message.transactionIndex = longToNumber(reader.uint64() as Long);
          break;
        case 3:
          message.actualFee = reader.bytes();
          break;
        case 4:
          message.executionResources = ExecutionResources.decode(reader, reader.uint32());
          break;
        case 5:
          message.l1ToL2ConsumedMessage = L1ToL2Message.decode(reader, reader.uint32());
          break;
        case 6:
          message.l2ToL1Messages.push(L2ToL1Message.decode(reader, reader.uint32()));
          break;
        case 7:
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
      transactionHash: isSet(object.transactionHash) ? bytesFromBase64(object.transactionHash) : new Uint8Array(),
      transactionIndex: isSet(object.transactionIndex) ? Number(object.transactionIndex) : 0,
      actualFee: isSet(object.actualFee) ? bytesFromBase64(object.actualFee) : new Uint8Array(),
      executionResources: isSet(object.executionResources)
        ? ExecutionResources.fromJSON(object.executionResources)
        : undefined,
      l1ToL2ConsumedMessage: isSet(object.l1ToL2ConsumedMessage)
        ? L1ToL2Message.fromJSON(object.l1ToL2ConsumedMessage)
        : undefined,
      l2ToL1Messages: Array.isArray(object?.l2ToL1Messages)
        ? object.l2ToL1Messages.map((e: any) => L2ToL1Message.fromJSON(e))
        : [],
      events: Array.isArray(object?.events) ? object.events.map((e: any) => Event.fromJSON(e)) : [],
    };
  },

  toJSON(message: TransactionReceipt): unknown {
    const obj: any = {};
    message.transactionHash !== undefined &&
      (obj.transactionHash = base64FromBytes(
        message.transactionHash !== undefined ? message.transactionHash : new Uint8Array(),
      ));
    message.transactionIndex !== undefined && (obj.transactionIndex = Math.round(message.transactionIndex));
    message.actualFee !== undefined &&
      (obj.actualFee = base64FromBytes(message.actualFee !== undefined ? message.actualFee : new Uint8Array()));
    message.executionResources !== undefined && (obj.executionResources = message.executionResources
      ? ExecutionResources.toJSON(message.executionResources)
      : undefined);
    message.l1ToL2ConsumedMessage !== undefined && (obj.l1ToL2ConsumedMessage = message.l1ToL2ConsumedMessage
      ? L1ToL2Message.toJSON(message.l1ToL2ConsumedMessage)
      : undefined);
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

  fromPartial<I extends Exact<DeepPartial<TransactionReceipt>, I>>(object: I): TransactionReceipt {
    const message = createBaseTransactionReceipt();
    message.transactionHash = object.transactionHash ?? new Uint8Array();
    message.transactionIndex = object.transactionIndex ?? 0;
    message.actualFee = object.actualFee ?? new Uint8Array();
    message.executionResources = (object.executionResources !== undefined && object.executionResources !== null)
      ? ExecutionResources.fromPartial(object.executionResources)
      : undefined;
    message.l1ToL2ConsumedMessage =
      (object.l1ToL2ConsumedMessage !== undefined && object.l1ToL2ConsumedMessage !== null)
        ? L1ToL2Message.fromPartial(object.l1ToL2ConsumedMessage)
        : undefined;
    message.l2ToL1Messages = object.l2ToL1Messages?.map((e) => L2ToL1Message.fromPartial(e)) || [];
    message.events = object.events?.map((e) => Event.fromPartial(e)) || [];
    return message;
  },
};

function createBaseExecutionResources(): ExecutionResources {
  return { nSteps: 0, nMemoryHoles: 0, builtinInstanceCounter: undefined };
}

export const ExecutionResources = {
  encode(message: ExecutionResources, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.nSteps !== 0) {
      writer.uint32(8).uint64(message.nSteps);
    }
    if (message.nMemoryHoles !== 0) {
      writer.uint32(16).uint64(message.nMemoryHoles);
    }
    if (message.builtinInstanceCounter !== undefined) {
      BuiltinInstanceCounter.encode(message.builtinInstanceCounter, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ExecutionResources {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExecutionResources();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.nSteps = longToNumber(reader.uint64() as Long);
          break;
        case 2:
          message.nMemoryHoles = longToNumber(reader.uint64() as Long);
          break;
        case 3:
          message.builtinInstanceCounter = BuiltinInstanceCounter.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ExecutionResources {
    return {
      nSteps: isSet(object.nSteps) ? Number(object.nSteps) : 0,
      nMemoryHoles: isSet(object.nMemoryHoles) ? Number(object.nMemoryHoles) : 0,
      builtinInstanceCounter: isSet(object.builtinInstanceCounter)
        ? BuiltinInstanceCounter.fromJSON(object.builtinInstanceCounter)
        : undefined,
    };
  },

  toJSON(message: ExecutionResources): unknown {
    const obj: any = {};
    message.nSteps !== undefined && (obj.nSteps = Math.round(message.nSteps));
    message.nMemoryHoles !== undefined && (obj.nMemoryHoles = Math.round(message.nMemoryHoles));
    message.builtinInstanceCounter !== undefined && (obj.builtinInstanceCounter = message.builtinInstanceCounter
      ? BuiltinInstanceCounter.toJSON(message.builtinInstanceCounter)
      : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ExecutionResources>, I>>(object: I): ExecutionResources {
    const message = createBaseExecutionResources();
    message.nSteps = object.nSteps ?? 0;
    message.nMemoryHoles = object.nMemoryHoles ?? 0;
    message.builtinInstanceCounter =
      (object.builtinInstanceCounter !== undefined && object.builtinInstanceCounter !== null)
        ? BuiltinInstanceCounter.fromPartial(object.builtinInstanceCounter)
        : undefined;
    return message;
  },
};

function createBaseBuiltinInstanceCounter(): BuiltinInstanceCounter {
  return {
    pedersenBuiltin: undefined,
    rangeCheckBuiltin: undefined,
    bitwiseBuiltin: undefined,
    outputBuiltin: undefined,
    ecdsaBuiltin: undefined,
    ecOpBuiltin: undefined,
  };
}

export const BuiltinInstanceCounter = {
  encode(message: BuiltinInstanceCounter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.pedersenBuiltin !== undefined) {
      writer.uint32(8).uint64(message.pedersenBuiltin);
    }
    if (message.rangeCheckBuiltin !== undefined) {
      writer.uint32(16).uint64(message.rangeCheckBuiltin);
    }
    if (message.bitwiseBuiltin !== undefined) {
      writer.uint32(24).uint64(message.bitwiseBuiltin);
    }
    if (message.outputBuiltin !== undefined) {
      writer.uint32(32).uint64(message.outputBuiltin);
    }
    if (message.ecdsaBuiltin !== undefined) {
      writer.uint32(40).uint64(message.ecdsaBuiltin);
    }
    if (message.ecOpBuiltin !== undefined) {
      writer.uint32(48).uint64(message.ecOpBuiltin);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BuiltinInstanceCounter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBuiltinInstanceCounter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.pedersenBuiltin = longToNumber(reader.uint64() as Long);
          break;
        case 2:
          message.rangeCheckBuiltin = longToNumber(reader.uint64() as Long);
          break;
        case 3:
          message.bitwiseBuiltin = longToNumber(reader.uint64() as Long);
          break;
        case 4:
          message.outputBuiltin = longToNumber(reader.uint64() as Long);
          break;
        case 5:
          message.ecdsaBuiltin = longToNumber(reader.uint64() as Long);
          break;
        case 6:
          message.ecOpBuiltin = longToNumber(reader.uint64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): BuiltinInstanceCounter {
    return {
      pedersenBuiltin: isSet(object.pedersenBuiltin) ? Number(object.pedersenBuiltin) : undefined,
      rangeCheckBuiltin: isSet(object.rangeCheckBuiltin) ? Number(object.rangeCheckBuiltin) : undefined,
      bitwiseBuiltin: isSet(object.bitwiseBuiltin) ? Number(object.bitwiseBuiltin) : undefined,
      outputBuiltin: isSet(object.outputBuiltin) ? Number(object.outputBuiltin) : undefined,
      ecdsaBuiltin: isSet(object.ecdsaBuiltin) ? Number(object.ecdsaBuiltin) : undefined,
      ecOpBuiltin: isSet(object.ecOpBuiltin) ? Number(object.ecOpBuiltin) : undefined,
    };
  },

  toJSON(message: BuiltinInstanceCounter): unknown {
    const obj: any = {};
    message.pedersenBuiltin !== undefined && (obj.pedersenBuiltin = Math.round(message.pedersenBuiltin));
    message.rangeCheckBuiltin !== undefined && (obj.rangeCheckBuiltin = Math.round(message.rangeCheckBuiltin));
    message.bitwiseBuiltin !== undefined && (obj.bitwiseBuiltin = Math.round(message.bitwiseBuiltin));
    message.outputBuiltin !== undefined && (obj.outputBuiltin = Math.round(message.outputBuiltin));
    message.ecdsaBuiltin !== undefined && (obj.ecdsaBuiltin = Math.round(message.ecdsaBuiltin));
    message.ecOpBuiltin !== undefined && (obj.ecOpBuiltin = Math.round(message.ecOpBuiltin));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<BuiltinInstanceCounter>, I>>(object: I): BuiltinInstanceCounter {
    const message = createBaseBuiltinInstanceCounter();
    message.pedersenBuiltin = object.pedersenBuiltin ?? undefined;
    message.rangeCheckBuiltin = object.rangeCheckBuiltin ?? undefined;
    message.bitwiseBuiltin = object.bitwiseBuiltin ?? undefined;
    message.outputBuiltin = object.outputBuiltin ?? undefined;
    message.ecdsaBuiltin = object.ecdsaBuiltin ?? undefined;
    message.ecOpBuiltin = object.ecOpBuiltin ?? undefined;
    return message;
  },
};

function createBaseL1ToL2Message(): L1ToL2Message {
  return {
    fromAddress: new Uint8Array(),
    toAddress: new Uint8Array(),
    selector: new Uint8Array(),
    payload: [],
    nonce: new Uint8Array(),
  };
}

export const L1ToL2Message = {
  encode(message: L1ToL2Message, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fromAddress.length !== 0) {
      writer.uint32(10).bytes(message.fromAddress);
    }
    if (message.toAddress.length !== 0) {
      writer.uint32(18).bytes(message.toAddress);
    }
    if (message.selector.length !== 0) {
      writer.uint32(26).bytes(message.selector);
    }
    for (const v of message.payload) {
      writer.uint32(34).bytes(v!);
    }
    if (message.nonce.length !== 0) {
      writer.uint32(42).bytes(message.nonce);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): L1ToL2Message {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseL1ToL2Message();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.fromAddress = reader.bytes();
          break;
        case 2:
          message.toAddress = reader.bytes();
          break;
        case 3:
          message.selector = reader.bytes();
          break;
        case 4:
          message.payload.push(reader.bytes());
          break;
        case 5:
          message.nonce = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): L1ToL2Message {
    return {
      fromAddress: isSet(object.fromAddress) ? bytesFromBase64(object.fromAddress) : new Uint8Array(),
      toAddress: isSet(object.toAddress) ? bytesFromBase64(object.toAddress) : new Uint8Array(),
      selector: isSet(object.selector) ? bytesFromBase64(object.selector) : new Uint8Array(),
      payload: Array.isArray(object?.payload) ? object.payload.map((e: any) => bytesFromBase64(e)) : [],
      nonce: isSet(object.nonce) ? bytesFromBase64(object.nonce) : new Uint8Array(),
    };
  },

  toJSON(message: L1ToL2Message): unknown {
    const obj: any = {};
    message.fromAddress !== undefined &&
      (obj.fromAddress = base64FromBytes(message.fromAddress !== undefined ? message.fromAddress : new Uint8Array()));
    message.toAddress !== undefined &&
      (obj.toAddress = base64FromBytes(message.toAddress !== undefined ? message.toAddress : new Uint8Array()));
    message.selector !== undefined &&
      (obj.selector = base64FromBytes(message.selector !== undefined ? message.selector : new Uint8Array()));
    if (message.payload) {
      obj.payload = message.payload.map((e) => base64FromBytes(e !== undefined ? e : new Uint8Array()));
    } else {
      obj.payload = [];
    }
    message.nonce !== undefined &&
      (obj.nonce = base64FromBytes(message.nonce !== undefined ? message.nonce : new Uint8Array()));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<L1ToL2Message>, I>>(object: I): L1ToL2Message {
    const message = createBaseL1ToL2Message();
    message.fromAddress = object.fromAddress ?? new Uint8Array();
    message.toAddress = object.toAddress ?? new Uint8Array();
    message.selector = object.selector ?? new Uint8Array();
    message.payload = object.payload?.map((e) => e) || [];
    message.nonce = object.nonce ?? new Uint8Array();
    return message;
  },
};

function createBaseL2ToL1Message(): L2ToL1Message {
  return { fromAddress: new Uint8Array(), toAddress: new Uint8Array(), payload: [] };
}

export const L2ToL1Message = {
  encode(message: L2ToL1Message, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fromAddress.length !== 0) {
      writer.uint32(10).bytes(message.fromAddress);
    }
    if (message.toAddress.length !== 0) {
      writer.uint32(18).bytes(message.toAddress);
    }
    for (const v of message.payload) {
      writer.uint32(26).bytes(v!);
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
        case 1:
          message.fromAddress = reader.bytes();
          break;
        case 2:
          message.toAddress = reader.bytes();
          break;
        case 3:
          message.payload.push(reader.bytes());
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
      fromAddress: isSet(object.fromAddress) ? bytesFromBase64(object.fromAddress) : new Uint8Array(),
      toAddress: isSet(object.toAddress) ? bytesFromBase64(object.toAddress) : new Uint8Array(),
      payload: Array.isArray(object?.payload) ? object.payload.map((e: any) => bytesFromBase64(e)) : [],
    };
  },

  toJSON(message: L2ToL1Message): unknown {
    const obj: any = {};
    message.fromAddress !== undefined &&
      (obj.fromAddress = base64FromBytes(message.fromAddress !== undefined ? message.fromAddress : new Uint8Array()));
    message.toAddress !== undefined &&
      (obj.toAddress = base64FromBytes(message.toAddress !== undefined ? message.toAddress : new Uint8Array()));
    if (message.payload) {
      obj.payload = message.payload.map((e) => base64FromBytes(e !== undefined ? e : new Uint8Array()));
    } else {
      obj.payload = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<L2ToL1Message>, I>>(object: I): L2ToL1Message {
    const message = createBaseL2ToL1Message();
    message.fromAddress = object.fromAddress ?? new Uint8Array();
    message.toAddress = object.toAddress ?? new Uint8Array();
    message.payload = object.payload?.map((e) => e) || [];
    return message;
  },
};

function createBaseEvent(): Event {
  return { fromAddress: new Uint8Array(), keys: [], data: [] };
}

export const Event = {
  encode(message: Event, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fromAddress.length !== 0) {
      writer.uint32(10).bytes(message.fromAddress);
    }
    for (const v of message.keys) {
      writer.uint32(18).bytes(v!);
    }
    for (const v of message.data) {
      writer.uint32(26).bytes(v!);
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
          message.fromAddress = reader.bytes();
          break;
        case 2:
          message.keys.push(reader.bytes());
          break;
        case 3:
          message.data.push(reader.bytes());
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
      fromAddress: isSet(object.fromAddress) ? bytesFromBase64(object.fromAddress) : new Uint8Array(),
      keys: Array.isArray(object?.keys) ? object.keys.map((e: any) => bytesFromBase64(e)) : [],
      data: Array.isArray(object?.data) ? object.data.map((e: any) => bytesFromBase64(e)) : [],
    };
  },

  toJSON(message: Event): unknown {
    const obj: any = {};
    message.fromAddress !== undefined &&
      (obj.fromAddress = base64FromBytes(message.fromAddress !== undefined ? message.fromAddress : new Uint8Array()));
    if (message.keys) {
      obj.keys = message.keys.map((e) => base64FromBytes(e !== undefined ? e : new Uint8Array()));
    } else {
      obj.keys = [];
    }
    if (message.data) {
      obj.data = message.data.map((e) => base64FromBytes(e !== undefined ? e : new Uint8Array()));
    } else {
      obj.data = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Event>, I>>(object: I): Event {
    const message = createBaseEvent();
    message.fromAddress = object.fromAddress ?? new Uint8Array();
    message.keys = object.keys?.map((e) => e) || [];
    message.data = object.data?.map((e) => e) || [];
    return message;
  },
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var globalThis: any = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw "Unable to locate global object";
})();

function bytesFromBase64(b64: string): Uint8Array {
  if (globalThis.Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if (globalThis.Buffer) {
    return globalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(""));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function toTimestamp(date: Date): Timestamp {
  const seconds = date.getTime() / 1_000;
  const nanos = (date.getTime() % 1_000) * 1_000_000;
  return { seconds, nanos };
}

function fromTimestamp(t: Timestamp): Date {
  let millis = t.seconds * 1_000;
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

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
