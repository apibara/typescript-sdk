import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import {
  defaultResource,
  resourceFromAttributes,
} from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { createLogger } from "apibara/runtime";
import type { LoggerFactoryFn, RegisterFn } from "apibara/types";

export const register: RegisterFn = async () => {
  // Create a resource that identifies your service
  const resource = defaultResource().merge(
    resourceFromAttributes({
      [ATTR_SERVICE_NAME]: "apibara",
      [ATTR_SERVICE_VERSION]: "1.0.0",
    }),
  );
  const collectorOptions = {
    // configure the grpc endpoint of the opentelemetry-collector
    url: "http://localhost:4317",
  };

  // Configure the OTLP exporter for metrics using grpc protocol,
  const metricExporter = new OTLPMetricExporter(collectorOptions);
  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 1000,
  });

  // Configure the OTLP exporter for traces using grpc protocol,
  const traceExporter = new OTLPTraceExporter(collectorOptions);
  const spanProcessors = [new SimpleSpanProcessor(traceExporter)];

  // Configure the SDK
  const sdk = new NodeSDK({
    resource,
    spanProcessors,
    metricReader,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  // Start the SDK
  sdk.start();
};

// You can create a logger with any configuration you want which returns a ConsolaReporter
export const logger: LoggerFactoryFn = ({ indexer, indexers, preset }) => {
  // Below logger is just a small customized example of the default logger used by apibara
  return createLogger({
    indexer: `cli-${indexer}`,
    indexers,
    preset,
  });
};
