import { type RpcLog, type Block as ViemBlock, hexToNumber } from "viem";
import type { BlockHeader as DnaBlockHeader, Log as DnaLog } from "./block";

export function viemRpcLogToDna(viemLog: RpcLog): DnaLog {
  if (
    viemLog.logIndex === null ||
    viemLog.transactionIndex === null ||
    viemLog.transactionHash === null
  ) {
    throw new Error(
      "Invalid log: missing required fields: logIndex, transactionIndex, transactionHash",
    );
  }

  return {
    filterIds: [],
    logIndex: hexToNumber(viemLog.logIndex),
    address: viemLog.address,
    topics: viemLog.topics,
    data: viemLog.data,
    transactionIndex: hexToNumber(viemLog.transactionIndex),
    transactionHash: viemLog.transactionHash,
    transactionStatus: viemLog.removed ? "reverted" : "succeeded",
    logIndexInTransaction: hexToNumber(viemLog.logIndex),
  };
}

export function viemBlockHeaderToDna(viemBlock: ViemBlock): DnaBlockHeader {
  if (!viemBlock.number || !viemBlock.hash) {
    throw new Error(
      `Invalid block: missing required fields (number: ${viemBlock.number}, hash: ${viemBlock.hash})`,
    );
  }

  // TODO: check
  const emptyBloom = "0x0" as const;

  return {
    blockNumber: viemBlock.number,
    blockHash: viemBlock.hash,
    parentBlockHash: viemBlock.parentHash,
    unclesHash: viemBlock.sha3Uncles,
    miner: viemBlock.miner ?? "0x0000000000000000000000000000000000000000",
    stateRoot: viemBlock.stateRoot,
    transactionsRoot: viemBlock.transactionsRoot,
    receiptsRoot: viemBlock.receiptsRoot,
    logsBloom: viemBlock.logsBloom ?? emptyBloom,
    difficulty: viemBlock.difficulty,
    gasLimit: viemBlock.gasLimit,
    gasUsed: viemBlock.gasUsed,
    timestamp: new Date(Number(viemBlock.timestamp) * 1000),
    extraData: viemBlock.extraData,
    mixHash: viemBlock.mixHash ?? undefined,
    nonce: viemBlock.nonce ? BigInt(viemBlock.nonce) : undefined,
    baseFeePerGas: viemBlock.baseFeePerGas ?? undefined,
    withdrawalsRoot: viemBlock.withdrawalsRoot ?? undefined,
    totalDifficulty: viemBlock.totalDifficulty ?? undefined,
    blobGasUsed: viemBlock.blobGasUsed ?? undefined,
    excessBlobGas: viemBlock.excessBlobGas ?? undefined,
    parentBeaconBlockRoot: viemBlock.parentBeaconBlockRoot ?? undefined,
    requestsHash: undefined, // TODO: check
  };
}
