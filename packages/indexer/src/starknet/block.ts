import type { FieldElement } from "./felt";

export type Block = Partial<{
  /** Block header. */
  header: BlockHeader;
  /** Transactions. */
  transactions: TransactionWithReceipt[];
  /** Events. */
  events: EventWithTransaction[];
  /** Messages from L2 to L1. */
  l2ToL1Messages: L2ToL1MessageWithTransaction[];
  /** State update. */
  stateUpdate: StateUpdate;
}>;

export type BlockHeader = Partial<{
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
  /** Starknet version. */
  starknetVersion: string;
  /** Price of L1 gas in the block. */
  l1GasPrice?: ResourcePrice;
  /** Price of L1 data gas in the block. */
  l1DataGasPrice?: ResourcePrice;
  /** L1 data availability mode. */
  l1DataAvailabilityMode?: L1DataAvailabilityMode;
}>;

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
    | InvokeTransactionV3
    | DeployTransaction
    | DeclareTransaction
    | DeclareTransactionV3
    | DeployAccountTransaction
    | DeployAccountTransactionV3
    | L1HandlerTransaction
  );

export type TransactionCommon = {
  meta: TransactionMeta;
};

export type TransactionMeta = Partial<{
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
  /** Transaction resources. */
  resourceBounds?: ResourceBoundsMapping;
  /** Tip to the sequencer. */
  tip?: number;
  /** Data passed to the paymaster. */
  paymasterData?: FieldElement[];
  /** Account nonce's DA. */
  nonceDataAvailabilityMode?: DataAvailabilityMode;
  /** Transaction's DA. */
  feeDataAvailabilityMode?: DataAvailabilityMode;
  /** Transaction index in the block. */
  transactionIndex?: number;
}>;

export type InvokeTransactionV0 = {
  invokeV0?: Partial<{
    /** Target contract address. */
    contractAddress: FieldElement;
    /** Selector of the function being invoked. */
    entryPointSelector: FieldElement;
    /** Calldata. */
    calldata: FieldElement[];
  }>;
  invokeV1?: never;
  invokeV3?: never;
  deploy?: never;
  declare?: never;
  declareV3?: never;
  l1Handler?: never;
  deployAccount?: never;
  deployAccountV3?: never;
};

export type InvokeTransactionV1 = {
  invokeV1?: Partial<{
    /** Address of the account sending the transaction. */
    senderAddress: FieldElement;
    /** Calldata. */
    calldata: FieldElement[];
  }>;
  invokeV0?: never;
  invokeV3?: never;
  deploy?: never;
  declare?: never;
  declareV3?: never;
  l1Handler?: never;
  deployAccount?: never;
  deployAccountV3?: never;
};

export type InvokeTransactionV3 = {
  invokeV3?: Partial<{
    /** Address of the account sending the transaction. */
    senderAddress: FieldElement;
    /** Calldata. */
    calldata: FieldElement[];
    /** Data passed to the account deployment. */
    accountDeploymentData: FieldElement[];
  }>;
  invokeV1?: never;
  invokeV0?: never;
  deploy?: never;
  declare?: never;
  declareV3?: never;
  l1Handler?: never;
  deployAccount?: never;
  deployAccountV3?: never;
};

export type DeployTransaction = {
  deploy?: Partial<{
    /** Constructor calldata. */
    constructorCalldata: FieldElement[];
    /** Salt used when computing the contract's address. */
    contractAddressSalt: FieldElement;
    /** Hash of the class being deployed. */
    classHash: FieldElement;
  }>;
  invokeV0?: never;
  invokeV1?: never;
  invokeV3?: never;
  declare?: never;
  declareV3?: never;
  l1Handler?: never;
  deployAccount?: never;
  deployAccountV3?: never;
};

export type DeclareTransaction = {
  declare?: Partial<{
    /** Class hash. */
    classHash: FieldElement;
    /** Address of the account sending the transaction. */
    senderAddress: FieldElement;
    /** Hash of the cairo assembly resulting from the sierra compilation. */
    compiledClassHash: FieldElement;
  }>;
  declareV3?: never;
  invokeV0?: never;
  invokeV1?: never;
  invokeV3?: never;
  deploy?: never;
  l1Handler?: never;
  deployAccount?: never;
  deployAccountV3?: never;
};

export type DeclareTransactionV3 = {
  declareV3?: Partial<{
    /** Class hash. */
    classHash: FieldElement;
    /** Address of the account sending the transaction. */
    senderAddress: FieldElement;
    /** Hash of the cairo assembly resulting from the sierra compilation. */
    compiledClassHash: FieldElement;
    /** Data passed to the account deployment. */
    accountDeploymentData: FieldElement[];
  }>;
  declare?: never;
  invokeV0?: never;
  invokeV1?: never;
  invokeV3?: never;
  deploy?: never;
  deployAccountV3?: never;
  l1Handler?: never;
  deployAccount?: never;
};

export type DeployAccountTransaction = {
  deployAccount?: Partial<{
    /** Constructor calldata. */
    constructorCalldata: FieldElement[];
    /** Salt used when computing the contract's address. */
    contractAddressSalt: FieldElement;
    /** Hash of the class being deployed. */
    classHash: FieldElement;
  }>;
  deployAccountV3?: never;
  invokeV0?: never;
  invokeV1?: never;
  invokeV3?: never;
  deploy?: never;
  declare?: never;
  declareV3?: never;
  l1Handler?: never;
};

export type DeployAccountTransactionV3 = {
  deployAccountV3?: Partial<{
    /** Constructor calldata. */
    constructorCalldata: FieldElement[];
    /** Salt used when computing the contract's address. */
    contractAddressSalt: FieldElement;
    /** Hash of the class being deployed. */
    classHash: FieldElement;
  }>;
  deployAccount?: never;
  invokeV0?: never;
  invokeV1?: never;
  invokeV3?: never;
  deploy?: never;
  declare?: never;
  declareV3?: never;
  l1Handler?: never;
};

export type L1HandlerTransaction = {
  l1Handler?: Partial<{
    /** Target contract address. */
    contractAddress: FieldElement;
    /** Selector of the function being invoked. */
    entryPointSelector: FieldElement;
    /** Calldata. */
    calldata: FieldElement[];
  }>;
  invokeV0?: never;
  invokeV1?: never;
  invokeV3?: never;
  deploy?: never;
  declare?: never;
  declareV3?: never;
  deployAccount?: never;
};

export type TransactionReceipt = Partial<{
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
  revertReason: string;
  /** Fee paid. */
  actualFeePaid: FeePayment;
  /** Resources consumed by the transaction. */
  executionResources: ExecutionResources;
}>;

export type ExecutionStatus =
  | "EXECUTION_STATUS_UNSPECIFIED"
  | "EXECUTION_STATUS_SUCCEEDED"
  | "EXECUTION_STATUS_REVERTED";

export type FeePayment = Partial<{
  /** Amount paid. */
  amount: FieldElement;
  /** Unit of the amount. */
  unit: PriceUnit;
}>;

export type ExecutionResources = Partial<{
  /** Computation resources. */
  computation: ComputationResources;
  /** Data availability resources. */
  dataAvailability: DataAvailabilityResources;
}>;

export type DataAvailabilityResources = Partial<{
  /** The gas consumed by this transaction's data, 0 if it uses data gas for DA. */
  l1Gas: number;
  /** The data gas consumed by this transaction's data, 0 if it uses gas for DA. */
  l1DataGas: number;
}>;

export type ComputationResources = Partial<{
  /** The number of Cairo steps used. */
  steps: number;
  /** The number of unused memory cells. */
  memoryHoles: number;
  /** The number of RANGE_CHECK builtin instances. */
  rangeCheckBuiltinApplications: number;
  /** The number of Pedersen builtin instances. */
  pedersenBuiltinApplications: number;
  /** The number of Poseidon builtin instances. */
  poseidonBuiltinApplications: number;
  /** The number of EC_OP builtin instances. */
  ecOpBuiltinApplications: number;
  /** The number of ECDSA builtin instances. */
  ecdsaBuiltinApplications: number;
  /** The number of BITWISE builtin instances. */
  bitwiseBuiltinApplications: number;
  /** The number of KECCAK builtin instances. */
  keccakBuiltinApplications: number;
  /** The number of accesses to the segment arena. */
  segmentArenaBuiltin: number;
}>;

export type PriceUnit =
  | "PRICE_UNIT_UNSPECIFIED"
  | "PRICE_UNIT_FRI"
  | "PRICE_UNIT_WEI";

export type Event = Partial<{
  /** Event index. */
  index: number;
  /** Contract address. */
  fromAddress: FieldElement;
  /** Event selector. */
  keys: FieldElement[];
  /** Event data. */
  data: FieldElement[];
}>;

export type L2ToL1Message = Partial<{
  /** Message index. */
  index: number;
  /** L2 sender address. */
  fromAddress: FieldElement;
  /** L1 target address. */
  toAddress: FieldElement;
  /** Calldata. */
  payload: FieldElement[];
}>;

export type StateUpdate = Partial<{
  /** New state root. */
  newRoot: FieldElement;
  /** Old state root. */
  oldRoot: FieldElement;
  /** State diff. */
  stateDiff: StateDiff;
}>;

export type StateDiff = Partial<{
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
}>;

export type StorageDiff = Partial<{
  /** Contract address. */
  contractAddress: FieldElement;
  /** Changes in storage. */
  storageEntries: StorageEntry[];
}>;

export type StorageEntry = Partial<{
  /** Storage key. */
  key: FieldElement;
  /** New storage value. */
  value: FieldElement;
}>;

export type DeclaredContract = Partial<{
  /** Class hash. */
  classHash: FieldElement;
}>;

export type DeclaredClass = Partial<{
  /** Class hash. */
  classHash: FieldElement;
  /** Compiled class hash. */
  compiledClassHash: FieldElement;
}>;

export type ReplacedClass = Partial<{
  /** Contract address. */
  contractAddress: FieldElement;
  /** Class hash. */
  classHash: FieldElement;
}>;

export type DeployedContract = Partial<{
  /** Contract address. */
  contractAddress: FieldElement;
  /** Class hash. */
  classHash: FieldElement;
}>;

export type NonceUpdate = Partial<{
  /** Contract address. */
  contractAddress: FieldElement;
  /** New nonce. */
  nonce: FieldElement;
}>;

export type ResourcePrice = Partial<{
  /** Price in fri (10^-18 strk). */
  priceInFri: FieldElement;
  /** Price in wei (10^-18 eth). */
  priceInWei: FieldElement;
}>;

export type ResourceBoundsMapping = Partial<{
  l1Gas: ResourceBounds;
  l2Gas: ResourceBounds;
}>;

export type ResourceBounds = Partial<{
  maxAmount: number;
  maxPricePerUnit: Partial<{ low: number; high: number }>;
}>;

export type DataAvailabilityMode =
  | "DATA_AVAILABILITY_MODE_UNSPECIFIED"
  | "DATA_AVAILABILITY_MODE_L2"
  | "DATA_AVAILABILITY_MODE_L1";

export type L1DataAvailabilityMode =
  | "L1_DATA_AVAILABILITY_MODE_UNSPECIFIED"
  | "L1_DATA_AVAILABILITY_MODE_BLOB"
  | "L1_DATA_AVAILABILITY_MODE_CALLDATA";
