import { Schema } from "@effect/schema";
import type { ParseOptions } from "@effect/schema/AST";

import { Cursor } from "./common";

export class StatusRequest extends Schema.Class<StatusRequest>("StatusRequest")(
  {},
) {
  toProto(options?: ParseOptions) {
    return Schema.encodeSync(StatusRequest)(this, options);
  }

  static fromProto = Schema.decodeSync(StatusRequest);
}

export class StatusResponse extends Schema.Class<StatusResponse>(
  "StatusResponse",
)({
  currentHead: Schema.optional(Cursor),
  lastIngested: Schema.optional(Cursor),
}) {
  toProto(options?: ParseOptions) {
    return Schema.encodeSync(StatusResponse)(this, options);
  }

  static fromProto = Schema.decodeSync(StatusResponse);
}
