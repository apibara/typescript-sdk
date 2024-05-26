import { Cursor } from "./common";
import * as proto from "./proto";

export { DataFinality } from "./proto/stream";

export type StreamDataRequest = {
  startingCursor?: Cursor;
  finality?: proto.stream.DataFinality;
  filter?: Uint8Array[];
};

export const StreamDataRequest = {
  fromJSON(message: StreamDataRequest): proto.stream.StreamDataRequest {
    const startingCursor = message.startingCursor
      ? Cursor.fromJSON(message.startingCursor)
      : undefined;

    return {
      startingCursor,
      finality: message.finality,
      filter: message.filter ?? [],
    };
  },
};
