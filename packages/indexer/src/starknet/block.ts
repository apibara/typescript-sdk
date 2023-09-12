import { FieldElement } from "./felt";

export type Block = {
  /** Block header. */
  header?: BlockHeader;
  /** Transactions. */
  transactions?: TransactionWithReceipt[];
  /** Events. */
  events?: EventWithTransaction[];
  /** Messages from L2 to L1. */
  l2ToL1Messages?: L2ToL1MessageWithTransaction[];
  /** State update. */
  stateUpdate?: StateUpdate;
};

export type BlockHeader = {
  /** Block hash. */
  blockHash: FieldElement;
  /** Parent block hash. */
  parentBlockHash: FieldElement;
  /** Block number. */
  blockNumber: string;
  /** Sequencer address. */
  sequencerAddress: FieldElement;
  /** New state root. */
  newRoot: FieldElement;
  /** Block production timestamp. */
  timestamp: string;
};

export type TransactionWithReceipt = {
  /** Transaction. */
  transaction: Transaction;
  /** Transaction receipt. */
  receipt: TransactionReceipt;
};

export type EventWithTransaction = {
  /** Transaction. */
  transaction: Transaction;
  /** Transaction receipt. */
  receipt: TransactionReceipt;
  /** Event. */
  event: Event;
};

export type L2ToL1MessageWithTransaction = {
  /** Transaction. */
  transaction: Transaction;
  /** Message from L2 to L1. */
  message: L2ToL1Message;
};

export type Transaction = TransactionCommon &
  (
    | InvokeTransactionV0
    | InvokeTransactionV1
    | DeployTransaction
    | DeclareTransaction
    | DeployAccountTransaction
    | L1HandlerTransaction
  );

export type TransactionCommon = {
  meta: TransactionMeta;
};

export type TransactionMeta = {
  /** Transaction hash. */
  hash: FieldElement;
  /** Maximum fee. */
  maxFee: FieldElement;
  /** Signature. */
  signature: FieldElement[];
  /** Nonce. */
  nonce: FieldElement;
  /** Transaction version. */
  version: string;
};

export type InvokeTransactionV0 = {
  invokeV0?: {
    /** Target contract address. */
    contractAddress: FieldElement;
    /** Selector of the function being invoked. */
    entryPointSelector: FieldElement;
    /** Calldata. */
    calldata: FieldElement[];
  };
  invokeV1?: never;
  deploy?: never;
  declare?: never;
  l1Handler?: never;
  deployAccount?: never;
};

export type InvokeTransactionV1 = {
  invokeV1?: {
    /** Address of the account sending the transaction. */
    senderAddress: FieldElement;
    /** Calldata. */
    calldata: FieldElement[];
  };
  invokeV0?: never;
  deploy?: never;
  declare?: never;
  l1Handler?: never;
  deployAccount?: never;
};

export type DeployTransaction = {
  deploy?: {
    /** Constructor calldata. */
    constructorCalldata: FieldElement[];
    /** Salt used when computing the contract's address. */
    contractAddressSalt: FieldElement;
    /** Hash of the class being deployed. */
    classHash: FieldElement;
  };
  invokeV0?: never;
  invokeV1?: never;
  declare?: never;
  l1Handler?: never;
  deployAccount?: never;
};

export type DeclareTransaction = {
  declare?: {
    /** Class hash. */
    classHash: FieldElement;
    /** Address of the account sending the transaction. */
    senderAddress: FieldElement;
    /** Hash of the cairo assembly resulting from the sierra compilation. */
    compiledClassHash: FieldElement;
  };
  invokeV0?: never;
  invokeV1?: never;
  deploy?: never;
  l1Handler?: never;
  deployAccount?: never;
};

export type DeployAccountTransaction = {
  deployAccount?: {
    /** Constructor calldata. */
    constructorCalldata: FieldElement[];
    /** Salt used when computing the contract's address. */
    contractAddressSalt: FieldElement;
    /** Hash of the class being deployed. */
    classHash: FieldElement;
  };
  invokeV0?: never;
  invokeV1?: never;
  deploy?: never;
  declare?: never;
  l1Handler?: never;
};

export type L1HandlerTransaction = {
  l1Handler?: {
    /** Target contract address. */
    contractAddress: FieldElement;
    /** Selector of the function being invoked. */
    entryPointSelector: FieldElement;
    /** Calldata. */
    calldata: FieldElement[];
  };
  invokeV0?: never;
  invokeV1?: never;
  deploy?: never;
  declare?: never;
  deployAccount?: never;
};

export type TransactionReceipt = {
  /** Transaction status. */
  executionStatus: ExecutionStatus;
  /** Transaction hash. */
  transactionHash: FieldElement;
  /** Transaction index. */
  transactionIndex: string;
  /** Actual fee paid by the account. */
  actualFee: FieldElement;
  /** Address of the contract created by the transaction. */
  contractAddress: FieldElement;
  /** Messages from L2 to L1. */
  l2ToL1Messages: L2ToL1Message[];
  /** Events. */
  events: Event[];
  /** Revert reason. */
  revertReason?: string;
};

export type ExecutionStatus =
  | "EXECUTION_STATUS_UNSPECIFIED"
  | "EXECUTION_STATUS_SUCCEEDED"
  | "EXECUTION_STATUS_REVERTED";

export type Event = {
  /** Event index. */
  index: number;
  /** Contract address. */
  fromAddress: FieldElement;
  /** Event selector. */
  keys: FieldElement[];
  /** Event data. */
  data: FieldElement[];
};

export type L2ToL1Message = {
  /** Message index. */
  index: number;
  /** L2 sender address. */
  fromAddress: FieldElement;
  /** L1 target address. */
  toAddress: FieldElement;
  /** Calldata. */
  payload: FieldElement[];
};

export type StateUpdate = {
  /** New state root. */
  newRoot: FieldElement;
  /** Old state root. */
  oldRoot: FieldElement;
  /** State diff. */
  stateDiff: StateDiff;
};

export type StateDiff = {
  /** Changes in storage. */
  storageDiffs: StorageDiff[];
  /** Declared contracts. */
  declaredContracts: DeclaredContract[];
  /** Deployed contracts. */
  deployedContracts: DeployedContract[];
  /** Nonce updates. */
  nonces: NonceUpdate[];
  /** Classes declared. */
  declaredClasses: DeclaredClass[];
  /** Classes replaced. */
  replacedClasses: ReplacedClass[];
};

export type StorageDiff = {
  /** Contract address. */
  contractAddress: FieldElement;
  /** Changes in storage. */
  storageEntries: StorageEntry[];
};

export type StorageEntry = {
  /** Storage key. */
  key: FieldElement;
  /** New storage value. */
  value: FieldElement;
};

export type DeclaredContract = {
  /** Class hash. */
  classHash: FieldElement;
};

export type DeclaredClass = {
  /** Class hash. */
  classHash: FieldElement;
  /** Compiled class hash. */
  compiledClassHash: FieldElement;
};

export type ReplacedClass = {
  /** Contract address. */
  contractAddress: FieldElement;
  /** Class hash. */
  classHash: FieldElement;
};

export type DeployedContract = {
  /** Contract address. */
  contractAddress: FieldElement;
  /** Class hash. */
  classHash: FieldElement;
};

export type NonceUpdate = {
  /** Contract address. */
  contractAddress: FieldElement;
  /** New nonce. */
  nonce: FieldElement;
};
