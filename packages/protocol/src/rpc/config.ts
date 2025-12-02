import type { Bytes, Cursor } from "../common";

export type FetchBlockRangeArgs<TFilter> = {
  startBlock: bigint;
  finalizedBlock: bigint;
  force: boolean;
  filter: TFilter;
};

export type FetchBlockRangeResult<TBlock> = {
  startBlock: bigint;
  endBlock: bigint;
  data: FetchBlockResult<TBlock>[];
};

export type FetchBlockResult<TBlock> = {
  block: TBlock | null;
  cursor: Cursor | undefined;
  endCursor: Cursor;
};

export type BlockInfo = {
  blockNumber: bigint;
  blockHash: Bytes;
  parentBlockHash: Bytes;
};

export type FetchBlockByNumberArgs<TFilter> = {
  blockNumber: bigint;
  expectedParentBlockHash: Bytes;
  isAtHead: boolean;
  filter: TFilter;
};

export type FetchBlockByNumberResult<TBlock> =
  | {
      status: "success";
      data: FetchBlockResult<TBlock>;
      blockInfo: BlockInfo;
    }
  | {
      status: "reorg";
      blockInfo: BlockInfo;
    };

export type FetchCursorArgs =
  | {
      blockTag: "latest" | "finalized";
      blockNumber?: undefined;
      blockHash?: undefined;
    }
  | {
      blockTag?: undefined;
      blockNumber: bigint;
      blockHash?: undefined;
    }
  | {
      blockTag?: undefined;
      blockNumber?: undefined;
      blockHash: Bytes;
    };

export type ValidateFilterResult =
  | {
      valid: true;
      error?: undefined;
    }
  | {
      valid: false;
      error: string;
    };

export abstract class RpcStreamConfig<TFilter, TBlock> {
  abstract headRefreshIntervalMs(): number;
  abstract finalizedRefreshIntervalMs(): number;

  abstract fetchCursor(args: FetchCursorArgs): Promise<BlockInfo | null>;

  abstract validateFilter(filter: TFilter): ValidateFilterResult;

  abstract fetchBlockRange(
    args: FetchBlockRangeArgs<TFilter>,
  ): Promise<FetchBlockRangeResult<TBlock>>;

  abstract fetchBlockByNumber(
    args: FetchBlockByNumberArgs<TFilter>,
  ): Promise<FetchBlockByNumberResult<TBlock>>;
}
