import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { Resource } from "@opentelemetry/resources";
import * as opentelemetry from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  type SpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import consola from "consola";

let spanProcessor: SpanProcessor | undefined;

const axiomApiKey = process.env.AXIOM_API_KEY;
const axiomDataset = process.env.AXIOM_DATASET ?? "evm-indexer-demo";
if (axiomApiKey) {
  const exporter = new OTLPTraceExporter({
    url: "https://api.axiom.co/v1/traces",
    headers: {
      Authorization: `Bearer ${axiomApiKey}`,
      "X-Axiom-Dataset": axiomDataset,
    },
  });
  spanProcessor = new BatchSpanProcessor(exporter);
  consola.info("Sending traces to Axiom", axiomDataset);
}

const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: "evm-indexer",
});

const sdk = new opentelemetry.NodeSDK(
  spanProcessor
    ? {
        spanProcessor,
        resource,
      }
    : {
        resource,
      },
);

consola.info("Starting OpenTelemetry SDK");
sdk.start();
