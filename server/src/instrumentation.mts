/**
 * OpenTelemetry bootstrap. Must be imported first (before any other app code)
 * so the SDK is registered and agent/server requests can be traced.
 * Incoming traceparent from the agent is extracted so server spans are linked to the same trace.
 */
import FastifyOtel from "@fastify/otel";
import { propagation } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import type { Instrumentation } from "@opentelemetry/instrumentation";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const isTest = process.env.NODE_ENV === "test";

if (!isTest) {
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());

  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const serviceName =
    process.env.OTEL_SERVICE_NAME ?? "timelord-server";

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
  });

  // CJS export=: ESM default can be the class or namespace with .default; resolve at runtime
  const FastifyOtelInstrumentation =
    typeof (FastifyOtel as { default?: unknown }).default === "function"
      ? (FastifyOtel as { default: new (opts?: { registerOnInitialization?: boolean }) => Instrumentation }).default
      : (FastifyOtel as unknown as new (opts?: { registerOnInitialization?: boolean }) => Instrumentation);

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
