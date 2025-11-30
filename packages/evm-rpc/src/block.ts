import type {
  BlockHeader as DnaBlockHeader,
  Log as DnaLog,
} from "@apibara/evm";

export type BlockHeader = DnaBlockHeader;

export type Log = Omit<DnaLog, "logIndexInTransaction">;

export type Block = {
  header: BlockHeader;
  logs: Log[];
};
