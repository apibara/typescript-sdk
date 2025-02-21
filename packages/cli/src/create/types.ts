export type ColorFunc = (str: string | number) => string;

export type Language = "typescript" | "javascript";

export type Chain = "starknet" | "ethereum" | "beaconchain";

export type Starknet_Network = "mainnet" | "sepolia";
export type Ethereum_Network = "mainnet" | "sepolia";
export type Beaconchain_Network = "mainnet";

export type Network =
  | Starknet_Network
  | Ethereum_Network
  | Beaconchain_Network
  | "other";

export type Storage = "postgres" | "none";

export type IndexerOptions = {
  cwd: string;
  indexerFileId: string;
  indexerId: string;
  chain: Chain;
  network: Network;
  storage: Storage;
  dnaUrl?: string;
  packageManager: string;
  language: Language;
};

export type PkgInfo = {
  name: string;
  version?: string;
};
