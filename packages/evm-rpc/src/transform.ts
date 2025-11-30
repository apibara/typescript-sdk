import {
  type RpcBlock,
  type RpcLog,
  type Block as ViemBlock,
  formatBlock,
  hexToNumber,
} from "viem";
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
  };
}

export function rpcBlockHeaderToDna(block: RpcBlock): DnaBlockHeader {
  const formattedBlock = formatBlock(block);
  return viemBlockHeaderToDna(formattedBlock);
}

export function viemBlockHeaderToDna(viemBlock: ViemBlock): DnaBlockHeader {
  if (viemBlock.number === null || !viemBlock.hash) {
    throw new Error(
      `Invalid block: missing required fields (number: ${viemBlock.number}, hash: ${viemBlock.hash})`,
    );
  }

  return {
    blockNumber: viemBlock.number,
    blockHash: viemBlock.hash,
    parentBlockHash: viemBlock.parentHash,
    unclesHash: viemBlock.sha3Uncles,
    miner: viemBlock.miner ?? undefined,
    stateRoot: viemBlock.stateRoot,
    transactionsRoot: viemBlock.transactionsRoot,
    receiptsRoot: viemBlock.receiptsRoot,
    logsBloom: viemBlock.logsBloom ?? undefined,
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
