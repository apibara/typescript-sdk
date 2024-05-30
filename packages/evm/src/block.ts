import { B256 } from "./common";
import * as proto from "./proto";

export type Decoder<TProto> = (data: Uint8Array) => TProto;
export type Parser<TProto, TData> = (proto: TProto) => TData;

export type Block = {
  header?: BlockHeader;
};

export type BlockHeader = {
  number: bigint;
  hash?: B256;
};

export const decodeBlock: Decoder<proto.data.Block> = proto.data.Block.decode;

export function parseBlock(message: proto.data.Block): Block {
  return {
    header: message?.header ? parseBlockHeader(message.header) : undefined,
  };
}

export function parseBlockHeader(message: proto.data.BlockHeader): BlockHeader {
  return {
    number: message.number ?? 0,
    hash: message.hash ? B256.fromProto(message.hash) : undefined,
  };
}
