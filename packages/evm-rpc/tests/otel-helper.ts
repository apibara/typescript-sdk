import { trace } from "@opentelemetry/api";
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";

let provider: BasicTracerProvider | undefined;
let exporter: InMemorySpanExporter | undefined;

export function setupTestTracer() {
  exporter = new InMemorySpanExporter();
  provider = new BasicTracerProvider();
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  trace.setGlobalTracerProvider(provider);

  return { exporter, provider };
}

export function resetSpans() {
  exporter?.reset();
}

export function getFinishedSpans() {
  return exporter?.getFinishedSpans() ?? [];
}
