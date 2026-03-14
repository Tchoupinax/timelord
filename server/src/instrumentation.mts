/**
 * OpenTelemetry bootstrap. Must be imported first (before any other app code)
 * so the SDK is registered and agent/server requests can be traced.
 * Incoming traceparent from the agent is extracted so server spans are linked to the same trace.
 */
import { propagation } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import FastifyOtelInstrumentation from "@fastify/otel";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { Resource } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const isTest = process.env.NODE_ENV === "test";

if (!isTest) {
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());

  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const serviceName =
    process.env.OTEL_SERVICE_NAME ?? "timelord-server";

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: serviceName,
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter: otlpEndpoint
      ? new OTLPTraceExporter({ url: otlpEndpoint })
      : new ConsoleSpanExporter(),
    instrumentations: [
      new HttpInstrumentation(),
      new FastifyOtelInstrumentation({ registerOnInitialization: true }),
    ],
  });

  sdk.start();
}
