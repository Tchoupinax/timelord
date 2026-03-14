# timelord — `Server`

## Environement variables

- `API_URL`: http endpoint of the API (http://localhost:9988)
- `OIDC_CLIENT_ID`: timelord
- `OIDC_CLIENT_SECRET`: insecure_secret
- `UI_URL`: http endpoint of the UI (http://localhost:3000)

## OpenTelemetry (tracing)

Tracing is enabled by default (disabled when `NODE_ENV=test`). You can follow agent requests and server activity in your observability backend.

- **Without exporter**: spans are printed to the console (development).
- **With OTLP**: set `OTEL_EXPORTER_OTLP_ENDPOINT` (e.g. `http://localhost:4318/v1/traces`) to send traces to a collector (Jaeger, Grafana Tempo, etc.).
- **Service name**: optional `OTEL_SERVICE_NAME` (default: `timelord-server`).

Agent requests are tagged with `timelord.agent.name` and `timelord.agent.hostname` so you can filter traces by agent in your UI.
