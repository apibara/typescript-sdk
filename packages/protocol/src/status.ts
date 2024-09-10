import { Schema } from "@effect/schema";

import { Cursor } from "./common";

/** The request to the `status` endpoint. */
export const StatusRequest = Schema.Struct({});

export type StatusRequest = typeof StatusRequest.Type;

export const statusRequestToProto = Schema.encodeSync(StatusRequest);
export const statusRequestFromProto = Schema.decodeSync(StatusRequest);

/** The response from the `status` endpoint. */
export const StatusResponse = Schema.Struct({
  currentHead: Schema.optional(Cursor),
  lastIngested: Schema.optional(Cursor),
  finalized: Schema.optional(Cursor),
  starting: Schema.optional(Cursor),
});

export type StatusResponse = typeof StatusResponse.Type;

export const statusResponseToProto = Schema.encodeSync(StatusResponse);
export const statusResponseFromProto = Schema.decodeSync(StatusResponse);
