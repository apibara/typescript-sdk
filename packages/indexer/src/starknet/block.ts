import { FieldElement } from "./felt";

export type Block = {
  header?: BlockHeader;
  transactions: TransactionWithReceipt[];
  events: EventWithTransaction[];
  l2ToL1Messages: L2ToL1MessageWithTransaction[];
  stateUpdate: StateUpdate;
};

export type BlockHeader = {
  blockHash: FieldElement;
  parentBlockHash: FieldElement;
  blockNumber: string;
  sequencerAddress: FieldElement;
  newRoot: FieldElement;
  timestamp: string;
};

export type TransactionWithReceipt = {
  transaction: Transaction;
  receipt: TransactionReceipt;
};

export type EventWithTransaction = {
  transaction: Transaction;
  receipt: TransactionReceipt;
  event: Event;
};

export type L2ToL1MessageWithTransaction = {
  transaction: Transaction;
  message: L2ToL1Message;
};

export type Transaction = {
  meta: TransactionMeta;
} & TransactionBody;

export type TransactionBody =
  | {
      invokeV0: InvokeTransactionV0;
    }
  | {
      invokeV1: InvokeTransactionV1;
    }
  | {
      deploy: DeployTransaction;
    }
  | {
      declare: DeclareTransaction;
    }
  | {
      deployAccount: DeployAccountTransaction;
    }
  | {
      l1Handler: L1HandlerTransaction;
    };

export type TransactionMeta = {
  hash: FieldElement;
  maxFee: FieldElement;
  signature: FieldElement[];
  nonce: FieldElement;
  version: string;
};

export type InvokeTransactionV0 = {
  contractAddress: FieldElement;
  entryPointSelector: FieldElement;
  calldata: FieldElement[];
};

export type InvokeTransactionV1 = {
  contractAddress: FieldElement;
  entryPointSelector: FieldElement;
  calldata: FieldElement[];
};

export type DeployTransaction = {
  constructorCalldata: FieldElement[];
  contractAddressSalt: FieldElement;
  classHash: FieldElement;
};

export type DeclareTransaction = {
  classHash: FieldElement;
  senderAddress: FieldElement;
  compiledClassHash: FieldElement;
};

export type DeployAccountTransaction = {
  constructorCalldata: FieldElement[];
  contractAddressSalt: FieldElement;
  classHash: FieldElement;
};

export type L1HandlerTransaction = {
  contractAddress: FieldElement;
  entryPointSelector: FieldElement;
  calldata: FieldElement[];
};

export type TransactionReceipt = {
  executionStatus: ExecutionStatus;
  transactionHash: FieldElement;
  transactionIndex: string;
  actualFee: FieldElement;
  contractAddress: FieldElement;
  l2ToL1Messages: L2ToL1Message[];
  events: Event[];
  revertReason?: string;
};

export type ExecutionStatus =
  | "EXECUTION_STATUS_UNSPECIFIED"
  | "EXECUTION_STATUS_SUCCEEDED"
  | "EXECUTION_STATUS_REVERTED";

export type Event = {
  index: number;
  fromAddress: FieldElement;
  keys: FieldElement[];
  data: FieldElement[];
};

export type L2ToL1Message = {
  index: number;
  fromAddress: FieldElement;
  toAddress: FieldElement;
  payload: FieldElement[];
};

export type StateUpdate = {
  newRoot: FieldElement;
  oldRoot: FieldElement;
  stateDiff: StateDiff;
};

export type StateDiff = {
  storageDiffs: StorageDiff[];
  declaredContracts: DeclaredContract[];
  deployedContracts: DeployedContract[];
  nonces: NonceUpdate[];
  declaredClasses: DeclaredClass[];
  replacedClasses: ReplacedClass[];
};

export type StorageDiff = {
  contractAddress: FieldElement;
  storageEntries: StorageEntry[];
};

export type StorageEntry = {
  key: FieldElement;
  value: FieldElement;
};

export type DeclaredContract = {
  classHash: FieldElement;
};

export type DeclaredClass = {
  classHash: FieldElement;
  compiledClassHash: FieldElement;
};

export type ReplacedClass = {
  contractAddress: FieldElement;
  classHash: FieldElement;
};

export type DeployedContract = {
  contractAddress: FieldElement;
  classHash: FieldElement;
};

export type NonceUpdate = {
  contractAddress: FieldElement;
  nonce: FieldElement;
};
