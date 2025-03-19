import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  defaultResource,
  resourceFromAttributes,
} from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

// Create a resource that identifies your service
const resource = defaultResource().merge(
  resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "apibara",
    [ATTR_SERVICE_VERSION]: "1.0.0",
  }),
);

// By default port 9464 will be exposed on the apibara app
const prometheusExporter = new PrometheusExporter();

// Configure the OTLP exporter for traces using http protocol,
// You can use grpc protocol as well by switching to `@opentelemetry/exporter-trace-otlp-grpc`.
const traceExporter = new OTLPTraceExporter({
  // configure the endpoint of the trace collector
  url: "http://localhost:4318/v1/traces",
});
const spanProcessors = [new BatchSpanProcessor(traceExporter)];

// Configure the SDK
export const sdk = new NodeSDK({
  resource,
  metricReader: prometheusExporter,
  spanProcessors,
  instrumentations: [getNodeAutoInstrumentations()],
});
