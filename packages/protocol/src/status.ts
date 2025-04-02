import { type CodecType, MessageCodec, OptionalCodec } from "./codec";
import { Cursor } from "./common";

/** The request to the `status` endpoint. */
export const StatusRequest = MessageCodec({});

export type StatusRequest = CodecType<typeof StatusRequest>;

/** The response from the `status` endpoint. */
export const StatusResponse = MessageCodec({
  currentHead: OptionalCodec(Cursor),
  lastIngested: OptionalCodec(Cursor),
  finalized: OptionalCodec(Cursor),
  starting: OptionalCodec(Cursor),
});

export type StatusResponse = CodecType<typeof StatusResponse>;
