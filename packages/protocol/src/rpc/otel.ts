import { trace } from "@opentelemetry/api";

export function createTracer() {
  return trace.getTracer("@apibara/protocol");
}
