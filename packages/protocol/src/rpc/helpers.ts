import type { Cursor } from "../common";
import type { BlockInfo } from "./config";

export function blockInfoToCursor(blockInfo: BlockInfo): Cursor {
  return {
    orderKey: blockInfo.blockNumber,
    uniqueKey: blockInfo.blockHash,
  };
}
