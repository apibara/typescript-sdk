import { FieldElement } from "./felt";

export type Filter = {
  /** Header information. */
  header?: HeaderFilter;
  /** Include transactions. */
  transactions?: TransactionFilter[];
  /** Include events. */
  events?: EventFilter[];
  /** Include messages from L2 to L1. */
  messages?: L2ToL1MessageFilter[];
  /** Include state updates. */
  stateUpdate?: StateUpdateFilter;
};

export type HeaderFilter = {
  /* If true, only include headers if any other filter matches. */
  weak?: boolean;
};

export type TransactionFilterCommon = {
  /*** Include reverted transactions. */
  includeReverted?: boolean;
};

// TODO: add a `OneOf<T1, T2, T3, ..>` to enforce this pattern.

export type InvokeTransactionV0Filter = {
  invokeV0?: {
    /** Filter by contract address. */
    contractAddress?: FieldElement;
    /** Filter by function selector. */
    entryPointSelector?: FieldElement;
    /** Filter by function arguments. */
    calldata?: FieldElement[];
  };
  invokeV1?: never;
  deploy?: never;
  declare?: never;
  l1Handler?: never;
  deployAccount?: never;
};

export type InvokeTransactionV1Filter = {
  invokeV1?: {
    /** Filter by sender address. */
    senderAddress?: FieldElement;
    /** Filter by function arguments. */
    calldata?: FieldElement[];
  };
  invokeV0?: never;
  deploy?: never;
  declare?: never;
  l1Handler?: never;
  deployAccount?: never;
};

export type DeployTransactionFilter = {
  deploy?: {
    /** Filter by contract address salt. */
    contractAddressSalt?: FieldElement;
    /** Filter by class hash. */
    classHash?: FieldElement;
    /** Filter by constructor arguments. */
    constructorCalldata?: FieldElement[];
  };
  invokeV0?: never;
  invokeV1?: never;
  declare?: never;
  l1Handler?: never;
  deployAccount?: never;
};

export type DeclareTransactionFilter = {
  declare?: {
    /** Filter by class hash. */
    classHash?: FieldElement;
    /** Filter by sender address. */
    senderAddress?: FieldElement;
  };
  invokeV0?: never;
  invokeV1?: never;
  deploy?: never;
  l1Handler?: never;
  deployAccount?: never;
};

export type L1HandlerTransactionFilter = {
  l1Handler?: {
    /** Filter by contract address. */
    contractAddress?: FieldElement;
    /** Filter by function selector. */
    entryPointSelector?: FieldElement;
    /** Filter by function arguments. */
    calldata?: FieldElement[];
  };
  invokeV0?: never;
  invokeV1?: never;
  deploy?: never;
  declare?: never;
  deployAccount?: never;
};

export type DeployAccountTransactionFilter = {
  deployAccount?: {
    /** Filter by contract address salt. */
    contractAddressSalt?: FieldElement;
    /** Filter by class hash. */
    classHash?: FieldElement;
    /** Filter by constructor arguments. */
    constructorCalldata?: FieldElement[];
  };
  invokeV0?: never;
  invokeV1?: never;
  deploy?: never;
  declare?: never;
  l1Handler?: never;
};

export type TransactionFilter = TransactionFilterCommon &
  (
    | InvokeTransactionV0Filter
    | InvokeTransactionV1Filter
    | DeployTransactionFilter
    | DeclareTransactionFilter
    | L1HandlerTransactionFilter
    | DeployAccountTransactionFilter
  );

export type EventFilter = {
  /** Filter by contract address. */
  fromAddress?: FieldElement;
  /** Filter by event keys (selector). */
  keys?: FieldElement[];
  /** Filter by event data. */
  data?: FieldElement[];
  /** Include events from reverted transactions. */
  includeReverted?: boolean;
  /** Include the transaction that emitted the event. Defaults to true. */
  includeTransaction?: boolean;
  /** Include the receipt of the transaction that emitted the event. Defaults to true. */
  includeReceipt?: boolean;
};

export type L2ToL1MessageFilter = {
  /** Filter by destination address. */
  toAddress?: FieldElement;
  /** Filter by payload. */
  payload?: FieldElement[];
  /** Include messages from reverted transactions. */
  includeReverted?: boolean;
};

export type StateUpdateFilter = {
  /** Filter storage diffs. */
  storageDiffs?: StorageDiffFilter[];
  /** Filter declared contracts. */
  declaredContracts?: DeclaredContractFilter[];
  /** Filter deployed contracts. */
  deployedContracts?: DeployedContractFilter[];
  /** Filter nonce updates. */
  nonces?: NonceUpdateFilter[];
  /** Filter declared classes. */
  declaredClasses?: DeclaredClassFilter[];
  /** Filter replaced classes. */
  replacedClasses?: ReplacedClassFilter[];
};

export type StorageDiffFilter = {
  /** Filter by contract address. */
  contractAddress?: FieldElement;
};

export type DeclaredContractFilter = {
  /** Filter by class hash. */
  classHash?: FieldElement;
};

export type DeployedContractFilter = {
  /** Filter by contract address. */
  contractAddress?: FieldElement;
  /** Filter by class hash. */
  classHash?: FieldElement;
};

export type NonceUpdateFilter = {
  /** Filter by contract address. */
  contractAddress?: FieldElement;
  /** Filter by nonce value. */
  nonce?: FieldElement;
};

export type DeclaredClassFilter = {
  /** Filter by class hash. */
  classHash?: FieldElement;
  /** Filter by compiled class hash. */
  compiledClassHash?: FieldElement;
};

export type ReplacedClassFilter = {
  /** Filter by contract address. */
  contractAddress?: FieldElement;
  /** Filter by class hash. */
  classHash?: FieldElement;
};
