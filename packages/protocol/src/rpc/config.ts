import type { Bytes, Cursor } from "../common";

export type FetchBlockRangeArgs<TFilter> = {
  startBlock: bigint;
  maxBlock: bigint;
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

export type FetchBlockByHashArgs<TFilter> = {
  blockHash: Bytes;
  isAtHead: boolean;
  filter: TFilter;
};

export type FetchBlockByHashResult<TBlock> = {
  data: FetchBlockResult<TBlock>;
  blockInfo: BlockInfo;
};

export type FetchCursorRangeArgs = {
  startBlockNumber: bigint;
  endBlockNumber: bigint;
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

  abstract fetchCursorRange(args: FetchCursorRangeArgs): Promise<BlockInfo[]>;
  abstract fetchCursor(args: FetchCursorArgs): Promise<BlockInfo | null>;

  abstract validateFilter(filter: TFilter): ValidateFilterResult;

  abstract fetchBlockRange(
    args: FetchBlockRangeArgs<TFilter>,
  ): Promise<FetchBlockRangeResult<TBlock>>;

  abstract fetchBlockByHash(
    args: FetchBlockByHashArgs<TFilter>,
  ): Promise<FetchBlockByHashResult<TBlock>>;
}
