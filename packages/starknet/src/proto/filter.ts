/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { FieldElement } from "./types";

export const protobufPackage = "apibara.starknet.v1alpha2";

/** Filter describing what data to return for each block. */
export interface Filter {
  /** Header information. */
  header:
    | HeaderFilter
    | undefined;
  /** Transactions. */
  transactions: TransactionFilter[];
  /** State update. */
  stateUpdate:
    | StateUpdateFilter
    | undefined;
  /** Emitted events. */
  events: EventFilter[];
  /** Messages from L2 to L1. */
  messages: L2ToL1MessageFilter[];
}

/**
 * Filter header.
 *
 * This filter matches _all_ headers, so it's only necessary
 * to include it in the filter to receive header data.
 */
export interface HeaderFilter {
}

/**
 * Filter transactions.
 *
 * An empty transaction filter matches _any_ transaction.
 */
export interface TransactionFilter {
  invokeV0: InvokeTransactionV0Filter | undefined;
  invokeV1: InvokeTransactionV1Filter | undefined;
  deploy: DeployTransactionFilter | undefined;
  declare: DeclareTransactionFilter | undefined;
  l1Handler: L1HandlerTransactionFilter | undefined;
  deployAccount: DeployAccountTransactionFilter | undefined;
}

/** Receive invoke transactions, v0 */
export interface InvokeTransactionV0Filter {
  /** Filter by contract address. */
  contractAddress:
    | FieldElement
    | undefined;
  /** Filter by selector. */
  entryPointSelector:
    | FieldElement
    | undefined;
  /** Filter by calldata prefix. */
  calldata: FieldElement[];
}

/** Receive invoke transactions, v1 */
export interface InvokeTransactionV1Filter {
  /** Filter by sender address. */
  senderAddress:
    | FieldElement
    | undefined;
  /** Filter by calldata prefix. */
  calldata: FieldElement[];
}

/** Receive deploy transactions. */
export interface DeployTransactionFilter {
  /** Filter by contract address salt. */
  contractAddressSalt:
    | FieldElement
    | undefined;
  /** Filter by class hash. */
  classHash:
    | FieldElement
    | undefined;
  /** Filter by calldata prefix. */
  constructorCalldata: FieldElement[];
}

/** Receive declare transactions. */
export interface DeclareTransactionFilter {
  /** Filter by class hash. */
  classHash:
    | FieldElement
    | undefined;
  /** Filter by sender address. */
  senderAddress: FieldElement | undefined;
}

/** Receive l1 handler transactions. */
export interface L1HandlerTransactionFilter {
  /** Filter by contract address. */
  contractAddress:
    | FieldElement
    | undefined;
  /** Filter by selector. */
  entryPointSelector:
    | FieldElement
    | undefined;
  /** Filter by calldata prefix. */
  calldata: FieldElement[];
}

/** Receive deploy account transactions. */
export interface DeployAccountTransactionFilter {
  /** Filter by contract address salt. */
  contractAddressSalt:
    | FieldElement
    | undefined;
  /** Filter by class hash. */
  classHash:
    | FieldElement
    | undefined;
  /** Filter by calldata prefix. */
  constructorCalldata: FieldElement[];
}

/** Filter L2 to L1 messages. */
export interface L2ToL1MessageFilter {
  /** Filter by destination address. */
  toAddress:
    | FieldElement
    | undefined;
  /** Filter payloads that prefix-match the given data. */
  payload: FieldElement[];
}

/** Filter events. */
export interface EventFilter {
  /** Filter by contract emitting the event. */
  fromAddress:
    | FieldElement
    | undefined;
  /** Filter keys that prefix-match the given data. */
  keys: FieldElement[];
  /** Filter data that prefix-match the given data. */
  data: FieldElement[];
}

/** Filter state update data. */
export interface StateUpdateFilter {
  /** Filter storage changes. */
  storageDiffs: StorageDiffFilter[];
  /** Filter declared contracts. */
  declaredContracts: DeclaredContractFilter[];
  /** Filter deployed contracts. */
  deployedContracts: DeployedContractFilter[];
  /** Filter nonces updates. */
  nonces: NonceUpdateFilter[];
}

/** Filter storage changes. */
export interface StorageDiffFilter {
  /** Filter by contract address. */
  contractAddress: FieldElement | undefined;
}

/** Filter declared contracts. */
export interface DeclaredContractFilter {
  /** Filter by class hash. */
  classHash: FieldElement | undefined;
}

/** Filter deployed contracts. */
export interface DeployedContractFilter {
  /** Filter by contract address. */
  contractAddress:
    | FieldElement
    | undefined;
  /** Filter by class hash. */
  classHash: FieldElement | undefined;
}

/** Filter nonce updates. */
export interface NonceUpdateFilter {
  /** Filter by contract address. */
  contractAddress:
    | FieldElement
    | undefined;
  /** Filter by new nonce value. */
  nonce: FieldElement | undefined;
}

function createBaseFilter(): Filter {
  return { header: undefined, transactions: [], stateUpdate: undefined, events: [], messages: [] };
}

export const Filter = {
  encode(message: Filter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.header !== undefined) {
      HeaderFilter.encode(message.header, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.transactions) {
      TransactionFilter.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.stateUpdate !== undefined) {
      StateUpdateFilter.encode(message.stateUpdate, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.events) {
      EventFilter.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    for (const v of message.messages) {
      L2ToL1MessageFilter.encode(v!, writer.uint32(42).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Filter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFilter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.header = HeaderFilter.decode(reader, reader.uint32());
          break;
        case 2:
          message.transactions.push(TransactionFilter.decode(reader, reader.uint32()));
          break;
        case 3:
          message.stateUpdate = StateUpdateFilter.decode(reader, reader.uint32());
          break;
        case 4:
          message.events.push(EventFilter.decode(reader, reader.uint32()));
          break;
        case 5:
          message.messages.push(L2ToL1MessageFilter.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Filter {
    return {
      header: isSet(object.header) ? HeaderFilter.fromJSON(object.header) : undefined,
      transactions: Array.isArray(object?.transactions)
        ? object.transactions.map((e: any) => TransactionFilter.fromJSON(e))
        : [],
      stateUpdate: isSet(object.stateUpdate) ? StateUpdateFilter.fromJSON(object.stateUpdate) : undefined,
      events: Array.isArray(object?.events) ? object.events.map((e: any) => EventFilter.fromJSON(e)) : [],
      messages: Array.isArray(object?.messages) ? object.messages.map((e: any) => L2ToL1MessageFilter.fromJSON(e)) : [],
    };
  },

  toJSON(message: Filter): unknown {
    const obj: any = {};
    message.header !== undefined && (obj.header = message.header ? HeaderFilter.toJSON(message.header) : undefined);
    if (message.transactions) {
      obj.transactions = message.transactions.map((e) => e ? TransactionFilter.toJSON(e) : undefined);
    } else {
      obj.transactions = [];
    }
    message.stateUpdate !== undefined &&
      (obj.stateUpdate = message.stateUpdate ? StateUpdateFilter.toJSON(message.stateUpdate) : undefined);
    if (message.events) {
      obj.events = message.events.map((e) => e ? EventFilter.toJSON(e) : undefined);
    } else {
      obj.events = [];
    }
    if (message.messages) {
      obj.messages = message.messages.map((e) => e ? L2ToL1MessageFilter.toJSON(e) : undefined);
    } else {
      obj.messages = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<Filter>): Filter {
    const message = createBaseFilter();
    message.header = (object.header !== undefined && object.header !== null)
      ? HeaderFilter.fromPartial(object.header)
      : undefined;
    message.transactions = object.transactions?.map((e) => TransactionFilter.fromPartial(e)) || [];
    message.stateUpdate = (object.stateUpdate !== undefined && object.stateUpdate !== null)
      ? StateUpdateFilter.fromPartial(object.stateUpdate)
      : undefined;
    message.events = object.events?.map((e) => EventFilter.fromPartial(e)) || [];
    message.messages = object.messages?.map((e) => L2ToL1MessageFilter.fromPartial(e)) || [];
    return message;
  },
};

function createBaseHeaderFilter(): HeaderFilter {
  return {};
}

export const HeaderFilter = {
  encode(_: HeaderFilter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): HeaderFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHeaderFilter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): HeaderFilter {
    return {};
  },

  toJSON(_: HeaderFilter): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial(_: DeepPartial<HeaderFilter>): HeaderFilter {
    const message = createBaseHeaderFilter();
    return message;
  },
};

function createBaseTransactionFilter(): TransactionFilter {
  return {
    invokeV0: undefined,
    invokeV1: undefined,
    deploy: undefined,
    declare: undefined,
    l1Handler: undefined,
    deployAccount: undefined,
  };
}

export const TransactionFilter = {
  encode(message: TransactionFilter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.invokeV0 !== undefined) {
      InvokeTransactionV0Filter.encode(message.invokeV0, writer.uint32(10).fork()).ldelim();
    }
    if (message.invokeV1 !== undefined) {
      InvokeTransactionV1Filter.encode(message.invokeV1, writer.uint32(18).fork()).ldelim();
    }
    if (message.deploy !== undefined) {
      DeployTransactionFilter.encode(message.deploy, writer.uint32(26).fork()).ldelim();
    }
    if (message.declare !== undefined) {
      DeclareTransactionFilter.encode(message.declare, writer.uint32(34).fork()).ldelim();
    }
    if (message.l1Handler !== undefined) {
      L1HandlerTransactionFilter.encode(message.l1Handler, writer.uint32(42).fork()).ldelim();
    }
    if (message.deployAccount !== undefined) {
      DeployAccountTransactionFilter.encode(message.deployAccount, writer.uint32(50).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionFilter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.invokeV0 = InvokeTransactionV0Filter.decode(reader, reader.uint32());
          break;
        case 2:
          message.invokeV1 = InvokeTransactionV1Filter.decode(reader, reader.uint32());
          break;
        case 3:
          message.deploy = DeployTransactionFilter.decode(reader, reader.uint32());
          break;
        case 4:
          message.declare = DeclareTransactionFilter.decode(reader, reader.uint32());
          break;
        case 5:
          message.l1Handler = L1HandlerTransactionFilter.decode(reader, reader.uint32());
          break;
        case 6:
          message.deployAccount = DeployAccountTransactionFilter.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): TransactionFilter {
    return {
      invokeV0: isSet(object.invokeV0) ? InvokeTransactionV0Filter.fromJSON(object.invokeV0) : undefined,
      invokeV1: isSet(object.invokeV1) ? InvokeTransactionV1Filter.fromJSON(object.invokeV1) : undefined,
      deploy: isSet(object.deploy) ? DeployTransactionFilter.fromJSON(object.deploy) : undefined,
      declare: isSet(object.declare) ? DeclareTransactionFilter.fromJSON(object.declare) : undefined,
      l1Handler: isSet(object.l1Handler) ? L1HandlerTransactionFilter.fromJSON(object.l1Handler) : undefined,
      deployAccount: isSet(object.deployAccount)
        ? DeployAccountTransactionFilter.fromJSON(object.deployAccount)
        : undefined,
    };
  },

  toJSON(message: TransactionFilter): unknown {
    const obj: any = {};
    message.invokeV0 !== undefined &&
      (obj.invokeV0 = message.invokeV0 ? InvokeTransactionV0Filter.toJSON(message.invokeV0) : undefined);
    message.invokeV1 !== undefined &&
      (obj.invokeV1 = message.invokeV1 ? InvokeTransactionV1Filter.toJSON(message.invokeV1) : undefined);
    message.deploy !== undefined &&
      (obj.deploy = message.deploy ? DeployTransactionFilter.toJSON(message.deploy) : undefined);
    message.declare !== undefined &&
      (obj.declare = message.declare ? DeclareTransactionFilter.toJSON(message.declare) : undefined);
    message.l1Handler !== undefined &&
      (obj.l1Handler = message.l1Handler ? L1HandlerTransactionFilter.toJSON(message.l1Handler) : undefined);
    message.deployAccount !== undefined && (obj.deployAccount = message.deployAccount
      ? DeployAccountTransactionFilter.toJSON(message.deployAccount)
      : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<TransactionFilter>): TransactionFilter {
    const message = createBaseTransactionFilter();
    message.invokeV0 = (object.invokeV0 !== undefined && object.invokeV0 !== null)
      ? InvokeTransactionV0Filter.fromPartial(object.invokeV0)
      : undefined;
    message.invokeV1 = (object.invokeV1 !== undefined && object.invokeV1 !== null)
      ? InvokeTransactionV1Filter.fromPartial(object.invokeV1)
      : undefined;
    message.deploy = (object.deploy !== undefined && object.deploy !== null)
      ? DeployTransactionFilter.fromPartial(object.deploy)
      : undefined;
    message.declare = (object.declare !== undefined && object.declare !== null)
      ? DeclareTransactionFilter.fromPartial(object.declare)
      : undefined;
    message.l1Handler = (object.l1Handler !== undefined && object.l1Handler !== null)
      ? L1HandlerTransactionFilter.fromPartial(object.l1Handler)
      : undefined;
    message.deployAccount = (object.deployAccount !== undefined && object.deployAccount !== null)
      ? DeployAccountTransactionFilter.fromPartial(object.deployAccount)
      : undefined;
    return message;
  },
};

function createBaseInvokeTransactionV0Filter(): InvokeTransactionV0Filter {
  return { contractAddress: undefined, entryPointSelector: undefined, calldata: [] };
}

export const InvokeTransactionV0Filter = {
  encode(message: InvokeTransactionV0Filter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
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

  decode(input: _m0.Reader | Uint8Array, length?: number): InvokeTransactionV0Filter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInvokeTransactionV0Filter();
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

  fromJSON(object: any): InvokeTransactionV0Filter {
    return {
      contractAddress: isSet(object.contractAddress) ? FieldElement.fromJSON(object.contractAddress) : undefined,
      entryPointSelector: isSet(object.entryPointSelector)
        ? FieldElement.fromJSON(object.entryPointSelector)
        : undefined,
      calldata: Array.isArray(object?.calldata) ? object.calldata.map((e: any) => FieldElement.fromJSON(e)) : [],
    };
  },

  toJSON(message: InvokeTransactionV0Filter): unknown {
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

  fromPartial(object: DeepPartial<InvokeTransactionV0Filter>): InvokeTransactionV0Filter {
    const message = createBaseInvokeTransactionV0Filter();
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

function createBaseInvokeTransactionV1Filter(): InvokeTransactionV1Filter {
  return { senderAddress: undefined, calldata: [] };
}

export const InvokeTransactionV1Filter = {
  encode(message: InvokeTransactionV1Filter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.senderAddress !== undefined) {
      FieldElement.encode(message.senderAddress, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.calldata) {
      FieldElement.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): InvokeTransactionV1Filter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInvokeTransactionV1Filter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.senderAddress = FieldElement.decode(reader, reader.uint32());
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

  fromJSON(object: any): InvokeTransactionV1Filter {
    return {
      senderAddress: isSet(object.senderAddress) ? FieldElement.fromJSON(object.senderAddress) : undefined,
      calldata: Array.isArray(object?.calldata) ? object.calldata.map((e: any) => FieldElement.fromJSON(e)) : [],
    };
  },

  toJSON(message: InvokeTransactionV1Filter): unknown {
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

  fromPartial(object: DeepPartial<InvokeTransactionV1Filter>): InvokeTransactionV1Filter {
    const message = createBaseInvokeTransactionV1Filter();
    message.senderAddress = (object.senderAddress !== undefined && object.senderAddress !== null)
      ? FieldElement.fromPartial(object.senderAddress)
      : undefined;
    message.calldata = object.calldata?.map((e) => FieldElement.fromPartial(e)) || [];
    return message;
  },
};

function createBaseDeployTransactionFilter(): DeployTransactionFilter {
  return { contractAddressSalt: undefined, classHash: undefined, constructorCalldata: [] };
}

export const DeployTransactionFilter = {
  encode(message: DeployTransactionFilter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.contractAddressSalt !== undefined) {
      FieldElement.encode(message.contractAddressSalt, writer.uint32(10).fork()).ldelim();
    }
    if (message.classHash !== undefined) {
      FieldElement.encode(message.classHash, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.constructorCalldata) {
      FieldElement.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeployTransactionFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeployTransactionFilter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.contractAddressSalt = FieldElement.decode(reader, reader.uint32());
          break;
        case 2:
          message.classHash = FieldElement.decode(reader, reader.uint32());
          break;
        case 4:
          message.constructorCalldata.push(FieldElement.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): DeployTransactionFilter {
    return {
      contractAddressSalt: isSet(object.contractAddressSalt)
        ? FieldElement.fromJSON(object.contractAddressSalt)
        : undefined,
      classHash: isSet(object.classHash) ? FieldElement.fromJSON(object.classHash) : undefined,
      constructorCalldata: Array.isArray(object?.constructorCalldata)
        ? object.constructorCalldata.map((e: any) => FieldElement.fromJSON(e))
        : [],
    };
  },

  toJSON(message: DeployTransactionFilter): unknown {
    const obj: any = {};
    message.contractAddressSalt !== undefined && (obj.contractAddressSalt = message.contractAddressSalt
      ? FieldElement.toJSON(message.contractAddressSalt)
      : undefined);
    message.classHash !== undefined &&
      (obj.classHash = message.classHash ? FieldElement.toJSON(message.classHash) : undefined);
    if (message.constructorCalldata) {
      obj.constructorCalldata = message.constructorCalldata.map((e) => e ? FieldElement.toJSON(e) : undefined);
    } else {
      obj.constructorCalldata = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<DeployTransactionFilter>): DeployTransactionFilter {
    const message = createBaseDeployTransactionFilter();
    message.contractAddressSalt = (object.contractAddressSalt !== undefined && object.contractAddressSalt !== null)
      ? FieldElement.fromPartial(object.contractAddressSalt)
      : undefined;
    message.classHash = (object.classHash !== undefined && object.classHash !== null)
      ? FieldElement.fromPartial(object.classHash)
      : undefined;
    message.constructorCalldata = object.constructorCalldata?.map((e) => FieldElement.fromPartial(e)) || [];
    return message;
  },
};

function createBaseDeclareTransactionFilter(): DeclareTransactionFilter {
  return { classHash: undefined, senderAddress: undefined };
}

export const DeclareTransactionFilter = {
  encode(message: DeclareTransactionFilter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.classHash !== undefined) {
      FieldElement.encode(message.classHash, writer.uint32(10).fork()).ldelim();
    }
    if (message.senderAddress !== undefined) {
      FieldElement.encode(message.senderAddress, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeclareTransactionFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeclareTransactionFilter();
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

  fromJSON(object: any): DeclareTransactionFilter {
    return {
      classHash: isSet(object.classHash) ? FieldElement.fromJSON(object.classHash) : undefined,
      senderAddress: isSet(object.senderAddress) ? FieldElement.fromJSON(object.senderAddress) : undefined,
    };
  },

  toJSON(message: DeclareTransactionFilter): unknown {
    const obj: any = {};
    message.classHash !== undefined &&
      (obj.classHash = message.classHash ? FieldElement.toJSON(message.classHash) : undefined);
    message.senderAddress !== undefined &&
      (obj.senderAddress = message.senderAddress ? FieldElement.toJSON(message.senderAddress) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<DeclareTransactionFilter>): DeclareTransactionFilter {
    const message = createBaseDeclareTransactionFilter();
    message.classHash = (object.classHash !== undefined && object.classHash !== null)
      ? FieldElement.fromPartial(object.classHash)
      : undefined;
    message.senderAddress = (object.senderAddress !== undefined && object.senderAddress !== null)
      ? FieldElement.fromPartial(object.senderAddress)
      : undefined;
    return message;
  },
};

function createBaseL1HandlerTransactionFilter(): L1HandlerTransactionFilter {
  return { contractAddress: undefined, entryPointSelector: undefined, calldata: [] };
}

export const L1HandlerTransactionFilter = {
  encode(message: L1HandlerTransactionFilter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
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

  decode(input: _m0.Reader | Uint8Array, length?: number): L1HandlerTransactionFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseL1HandlerTransactionFilter();
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

  fromJSON(object: any): L1HandlerTransactionFilter {
    return {
      contractAddress: isSet(object.contractAddress) ? FieldElement.fromJSON(object.contractAddress) : undefined,
      entryPointSelector: isSet(object.entryPointSelector)
        ? FieldElement.fromJSON(object.entryPointSelector)
        : undefined,
      calldata: Array.isArray(object?.calldata) ? object.calldata.map((e: any) => FieldElement.fromJSON(e)) : [],
    };
  },

  toJSON(message: L1HandlerTransactionFilter): unknown {
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

  fromPartial(object: DeepPartial<L1HandlerTransactionFilter>): L1HandlerTransactionFilter {
    const message = createBaseL1HandlerTransactionFilter();
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

function createBaseDeployAccountTransactionFilter(): DeployAccountTransactionFilter {
  return { contractAddressSalt: undefined, classHash: undefined, constructorCalldata: [] };
}

export const DeployAccountTransactionFilter = {
  encode(message: DeployAccountTransactionFilter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.contractAddressSalt !== undefined) {
      FieldElement.encode(message.contractAddressSalt, writer.uint32(10).fork()).ldelim();
    }
    if (message.classHash !== undefined) {
      FieldElement.encode(message.classHash, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.constructorCalldata) {
      FieldElement.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeployAccountTransactionFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeployAccountTransactionFilter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.contractAddressSalt = FieldElement.decode(reader, reader.uint32());
          break;
        case 2:
          message.classHash = FieldElement.decode(reader, reader.uint32());
          break;
        case 4:
          message.constructorCalldata.push(FieldElement.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): DeployAccountTransactionFilter {
    return {
      contractAddressSalt: isSet(object.contractAddressSalt)
        ? FieldElement.fromJSON(object.contractAddressSalt)
        : undefined,
      classHash: isSet(object.classHash) ? FieldElement.fromJSON(object.classHash) : undefined,
      constructorCalldata: Array.isArray(object?.constructorCalldata)
        ? object.constructorCalldata.map((e: any) => FieldElement.fromJSON(e))
        : [],
    };
  },

  toJSON(message: DeployAccountTransactionFilter): unknown {
    const obj: any = {};
    message.contractAddressSalt !== undefined && (obj.contractAddressSalt = message.contractAddressSalt
      ? FieldElement.toJSON(message.contractAddressSalt)
      : undefined);
    message.classHash !== undefined &&
      (obj.classHash = message.classHash ? FieldElement.toJSON(message.classHash) : undefined);
    if (message.constructorCalldata) {
      obj.constructorCalldata = message.constructorCalldata.map((e) => e ? FieldElement.toJSON(e) : undefined);
    } else {
      obj.constructorCalldata = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<DeployAccountTransactionFilter>): DeployAccountTransactionFilter {
    const message = createBaseDeployAccountTransactionFilter();
    message.contractAddressSalt = (object.contractAddressSalt !== undefined && object.contractAddressSalt !== null)
      ? FieldElement.fromPartial(object.contractAddressSalt)
      : undefined;
    message.classHash = (object.classHash !== undefined && object.classHash !== null)
      ? FieldElement.fromPartial(object.classHash)
      : undefined;
    message.constructorCalldata = object.constructorCalldata?.map((e) => FieldElement.fromPartial(e)) || [];
    return message;
  },
};

function createBaseL2ToL1MessageFilter(): L2ToL1MessageFilter {
  return { toAddress: undefined, payload: [] };
}

export const L2ToL1MessageFilter = {
  encode(message: L2ToL1MessageFilter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.toAddress !== undefined) {
      FieldElement.encode(message.toAddress, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.payload) {
      FieldElement.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): L2ToL1MessageFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseL2ToL1MessageFilter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.toAddress = FieldElement.decode(reader, reader.uint32());
          break;
        case 2:
          message.payload.push(FieldElement.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): L2ToL1MessageFilter {
    return {
      toAddress: isSet(object.toAddress) ? FieldElement.fromJSON(object.toAddress) : undefined,
      payload: Array.isArray(object?.payload) ? object.payload.map((e: any) => FieldElement.fromJSON(e)) : [],
    };
  },

  toJSON(message: L2ToL1MessageFilter): unknown {
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

  fromPartial(object: DeepPartial<L2ToL1MessageFilter>): L2ToL1MessageFilter {
    const message = createBaseL2ToL1MessageFilter();
    message.toAddress = (object.toAddress !== undefined && object.toAddress !== null)
      ? FieldElement.fromPartial(object.toAddress)
      : undefined;
    message.payload = object.payload?.map((e) => FieldElement.fromPartial(e)) || [];
    return message;
  },
};

function createBaseEventFilter(): EventFilter {
  return { fromAddress: undefined, keys: [], data: [] };
}

export const EventFilter = {
  encode(message: EventFilter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
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

  decode(input: _m0.Reader | Uint8Array, length?: number): EventFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventFilter();
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

  fromJSON(object: any): EventFilter {
    return {
      fromAddress: isSet(object.fromAddress) ? FieldElement.fromJSON(object.fromAddress) : undefined,
      keys: Array.isArray(object?.keys) ? object.keys.map((e: any) => FieldElement.fromJSON(e)) : [],
      data: Array.isArray(object?.data) ? object.data.map((e: any) => FieldElement.fromJSON(e)) : [],
    };
  },

  toJSON(message: EventFilter): unknown {
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

  fromPartial(object: DeepPartial<EventFilter>): EventFilter {
    const message = createBaseEventFilter();
    message.fromAddress = (object.fromAddress !== undefined && object.fromAddress !== null)
      ? FieldElement.fromPartial(object.fromAddress)
      : undefined;
    message.keys = object.keys?.map((e) => FieldElement.fromPartial(e)) || [];
    message.data = object.data?.map((e) => FieldElement.fromPartial(e)) || [];
    return message;
  },
};

function createBaseStateUpdateFilter(): StateUpdateFilter {
  return { storageDiffs: [], declaredContracts: [], deployedContracts: [], nonces: [] };
}

export const StateUpdateFilter = {
  encode(message: StateUpdateFilter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.storageDiffs) {
      StorageDiffFilter.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.declaredContracts) {
      DeclaredContractFilter.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.deployedContracts) {
      DeployedContractFilter.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.nonces) {
      NonceUpdateFilter.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StateUpdateFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStateUpdateFilter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.storageDiffs.push(StorageDiffFilter.decode(reader, reader.uint32()));
          break;
        case 2:
          message.declaredContracts.push(DeclaredContractFilter.decode(reader, reader.uint32()));
          break;
        case 3:
          message.deployedContracts.push(DeployedContractFilter.decode(reader, reader.uint32()));
          break;
        case 4:
          message.nonces.push(NonceUpdateFilter.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): StateUpdateFilter {
    return {
      storageDiffs: Array.isArray(object?.storageDiffs)
        ? object.storageDiffs.map((e: any) => StorageDiffFilter.fromJSON(e))
        : [],
      declaredContracts: Array.isArray(object?.declaredContracts)
        ? object.declaredContracts.map((e: any) => DeclaredContractFilter.fromJSON(e))
        : [],
      deployedContracts: Array.isArray(object?.deployedContracts)
        ? object.deployedContracts.map((e: any) => DeployedContractFilter.fromJSON(e))
        : [],
      nonces: Array.isArray(object?.nonces) ? object.nonces.map((e: any) => NonceUpdateFilter.fromJSON(e)) : [],
    };
  },

  toJSON(message: StateUpdateFilter): unknown {
    const obj: any = {};
    if (message.storageDiffs) {
      obj.storageDiffs = message.storageDiffs.map((e) => e ? StorageDiffFilter.toJSON(e) : undefined);
    } else {
      obj.storageDiffs = [];
    }
    if (message.declaredContracts) {
      obj.declaredContracts = message.declaredContracts.map((e) => e ? DeclaredContractFilter.toJSON(e) : undefined);
    } else {
      obj.declaredContracts = [];
    }
    if (message.deployedContracts) {
      obj.deployedContracts = message.deployedContracts.map((e) => e ? DeployedContractFilter.toJSON(e) : undefined);
    } else {
      obj.deployedContracts = [];
    }
    if (message.nonces) {
      obj.nonces = message.nonces.map((e) => e ? NonceUpdateFilter.toJSON(e) : undefined);
    } else {
      obj.nonces = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<StateUpdateFilter>): StateUpdateFilter {
    const message = createBaseStateUpdateFilter();
    message.storageDiffs = object.storageDiffs?.map((e) => StorageDiffFilter.fromPartial(e)) || [];
    message.declaredContracts = object.declaredContracts?.map((e) => DeclaredContractFilter.fromPartial(e)) || [];
    message.deployedContracts = object.deployedContracts?.map((e) => DeployedContractFilter.fromPartial(e)) || [];
    message.nonces = object.nonces?.map((e) => NonceUpdateFilter.fromPartial(e)) || [];
    return message;
  },
};

function createBaseStorageDiffFilter(): StorageDiffFilter {
  return { contractAddress: undefined };
}

export const StorageDiffFilter = {
  encode(message: StorageDiffFilter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.contractAddress !== undefined) {
      FieldElement.encode(message.contractAddress, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StorageDiffFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStorageDiffFilter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.contractAddress = FieldElement.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): StorageDiffFilter {
    return {
      contractAddress: isSet(object.contractAddress) ? FieldElement.fromJSON(object.contractAddress) : undefined,
    };
  },

  toJSON(message: StorageDiffFilter): unknown {
    const obj: any = {};
    message.contractAddress !== undefined &&
      (obj.contractAddress = message.contractAddress ? FieldElement.toJSON(message.contractAddress) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<StorageDiffFilter>): StorageDiffFilter {
    const message = createBaseStorageDiffFilter();
    message.contractAddress = (object.contractAddress !== undefined && object.contractAddress !== null)
      ? FieldElement.fromPartial(object.contractAddress)
      : undefined;
    return message;
  },
};

function createBaseDeclaredContractFilter(): DeclaredContractFilter {
  return { classHash: undefined };
}

export const DeclaredContractFilter = {
  encode(message: DeclaredContractFilter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.classHash !== undefined) {
      FieldElement.encode(message.classHash, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeclaredContractFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeclaredContractFilter();
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

  fromJSON(object: any): DeclaredContractFilter {
    return { classHash: isSet(object.classHash) ? FieldElement.fromJSON(object.classHash) : undefined };
  },

  toJSON(message: DeclaredContractFilter): unknown {
    const obj: any = {};
    message.classHash !== undefined &&
      (obj.classHash = message.classHash ? FieldElement.toJSON(message.classHash) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<DeclaredContractFilter>): DeclaredContractFilter {
    const message = createBaseDeclaredContractFilter();
    message.classHash = (object.classHash !== undefined && object.classHash !== null)
      ? FieldElement.fromPartial(object.classHash)
      : undefined;
    return message;
  },
};

function createBaseDeployedContractFilter(): DeployedContractFilter {
  return { contractAddress: undefined, classHash: undefined };
}

export const DeployedContractFilter = {
  encode(message: DeployedContractFilter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.contractAddress !== undefined) {
      FieldElement.encode(message.contractAddress, writer.uint32(10).fork()).ldelim();
    }
    if (message.classHash !== undefined) {
      FieldElement.encode(message.classHash, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeployedContractFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeployedContractFilter();
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

  fromJSON(object: any): DeployedContractFilter {
    return {
      contractAddress: isSet(object.contractAddress) ? FieldElement.fromJSON(object.contractAddress) : undefined,
      classHash: isSet(object.classHash) ? FieldElement.fromJSON(object.classHash) : undefined,
    };
  },

  toJSON(message: DeployedContractFilter): unknown {
    const obj: any = {};
    message.contractAddress !== undefined &&
      (obj.contractAddress = message.contractAddress ? FieldElement.toJSON(message.contractAddress) : undefined);
    message.classHash !== undefined &&
      (obj.classHash = message.classHash ? FieldElement.toJSON(message.classHash) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<DeployedContractFilter>): DeployedContractFilter {
    const message = createBaseDeployedContractFilter();
    message.contractAddress = (object.contractAddress !== undefined && object.contractAddress !== null)
      ? FieldElement.fromPartial(object.contractAddress)
      : undefined;
    message.classHash = (object.classHash !== undefined && object.classHash !== null)
      ? FieldElement.fromPartial(object.classHash)
      : undefined;
    return message;
  },
};

function createBaseNonceUpdateFilter(): NonceUpdateFilter {
  return { contractAddress: undefined, nonce: undefined };
}

export const NonceUpdateFilter = {
  encode(message: NonceUpdateFilter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.contractAddress !== undefined) {
      FieldElement.encode(message.contractAddress, writer.uint32(10).fork()).ldelim();
    }
    if (message.nonce !== undefined) {
      FieldElement.encode(message.nonce, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): NonceUpdateFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseNonceUpdateFilter();
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

  fromJSON(object: any): NonceUpdateFilter {
    return {
      contractAddress: isSet(object.contractAddress) ? FieldElement.fromJSON(object.contractAddress) : undefined,
      nonce: isSet(object.nonce) ? FieldElement.fromJSON(object.nonce) : undefined,
    };
  },

  toJSON(message: NonceUpdateFilter): unknown {
    const obj: any = {};
    message.contractAddress !== undefined &&
      (obj.contractAddress = message.contractAddress ? FieldElement.toJSON(message.contractAddress) : undefined);
    message.nonce !== undefined && (obj.nonce = message.nonce ? FieldElement.toJSON(message.nonce) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<NonceUpdateFilter>): NonceUpdateFilter {
    const message = createBaseNonceUpdateFilter();
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

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
