import type {
  BlockHeader as DnaBlockHeader,
  Log as DnaLog,
} from "@apibara/evm";

export type EvmRpcBlock = {
  header: BlockHeader;
  logs: Log[];
};

export type BlockHeader = DnaBlockHeader;

export type Log = DnaLog;
