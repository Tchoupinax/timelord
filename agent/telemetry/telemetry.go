package telemetry

import (
	"context"
	"net/url"
	"os"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.27.0"
)

const serviceName = "timelord-agent"

// Init initializes OpenTelemetry: tracer provider and W3C Trace Context propagation.
// Outgoing HTTP requests will include traceparent (and tracestate) so the server can continue the trace.
func Init(ctx context.Context) (func(), error) {
	resource, err := resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName(serviceName),
		),
	)
	if err != nil {
		return func() {}, err
	}

	var exp sdktrace.SpanExporter
	if endpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT"); endpoint != "" {
		exp, err = newOTLPExporter(ctx, endpoint)
		if err != nil {
			return func() {}, err
		}
	} else {
		exp, err = stdouttrace.New(stdouttrace.WithPrettyPrint())
		if err != nil {
			return func() {}, err
		}
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exp),
		sdktrace.WithResource(resource),
	)
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	return func() {
		_ = tp.Shutdown(ctx)
	}, nil
}

func newOTLPExporter(ctx context.Context, endpoint string) (sdktrace.SpanExporter, error) {
	u, err := url.Parse(endpoint)
	if err != nil {
		return nil, err
	}
	path := u.Path
	if path == "" {
		path = "/v1/traces"
	}
	opts := []otlptracehttp.Option{
		otlptracehttp.WithEndpoint(u.Host),
		otlptracehttp.WithURLPath(path),
	}
	if u.Scheme == "http" {
		opts = append(opts, otlptracehttp.WithInsecure())
	}
	return otlptracehttp.New(ctx, opts...)
}
