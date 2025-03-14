import { Schema } from "@effect/schema";

export function tag<T extends string>(tag: T) {
  return Schema.Literal(tag).pipe(
    Schema.propertySignature,
    Schema.fromKey("$case"),
  );
}
