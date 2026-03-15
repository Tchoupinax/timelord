#!/usr/bin/env bash
# Test that Docker Compose stack collects OpenTelemetry traces.
# Usage: from repo root, ./scripts/test-traces-collection.sh
# Requires: docker compose, curl, jq

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Starting stack (postgres, otel-collector, jaeger, server)..."
docker compose up -d

echo "==> Waiting for server (9988) and Jaeger UI (16686)..."
for i in {1..30}; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:9988/health 2>/dev/null | grep -q 200; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:16686 2>/dev/null | grep -q 200; then
      echo "    Services ready."
      break
    fi
  fi
  if [[ $i -eq 30 ]]; then
    echo "Timeout waiting for services. Check: docker compose logs"
    exit 1
  fi
  sleep 2
done

echo "==> Triggering traces (GET /health, GET /version)..."
curl -s http://localhost:9988/health > /dev/null
curl -s http://localhost:9988/version > /dev/null

echo "==> Waiting for trace export (5s)..."
sleep 5

echo "==> Querying Jaeger for traces (service=timelord-server)..."
TRACES_JSON=$(curl -s "http://localhost:16686/api/traces?service=timelord-server&limit=5")
TRACE_COUNT=$(echo "$TRACES_JSON" | jq -r '.data | length // 0')

if [[ "$TRACE_COUNT" -gt 0 ]]; then
  echo "    Found $TRACE_COUNT trace(s). Trace collection works."
  echo "    View traces: http://localhost:16686"
  exit 0
else
  echo "    No traces found. Response: $TRACES_JSON"
  exit 1
fi
