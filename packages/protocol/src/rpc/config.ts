import type { Bytes, Cursor } from "../common";
import type { BlockInfo, FinalizedRangeResult } from "./types";

export abstract class RpcStreamConfig<TFilter, TBlock> {
  abstract validateFilter(filter: TFilter): void;

  abstract getCursor(finality: "head" | "finalized"): Promise<Cursor>;

  abstract getBlockInfo(blockNumber: bigint): Promise<BlockInfo>;

  abstract fetchFinalizedRange(
    startBlock: bigint,
    endBlock: bigint,
    filter: TFilter[],
  ): Promise<FinalizedRangeResult<TBlock>>;

  abstract fetchBlock(
    blockNumber: bigint,
    filter: TFilter[],
  ): Promise<TBlock | null>;

  abstract verifyBlock(blockNumber: bigint, blockHash: Bytes): Promise<boolean>;
}
