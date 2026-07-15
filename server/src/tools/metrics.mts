import client from "prom-client";

const Registry = client.Registry;
const register = new Registry();

client.collectDefaultMetrics({ register });

export const agentsOnline = new client.Gauge({
  name: "timelord_agents_online",
  help: "Agents seen within the last 60 seconds",
  registers: [register],
});

export const agentsTotal = new client.Gauge({
  name: "timelord_agents_total",
  help: "Total registered agents",
  registers: [register],
});

export const jobQueueDepth = new client.Gauge({
  name: "timelord_job_queue_depth",
  help: "Jobs waiting in the manual queue",
  registers: [register],
});

export const jobsRunning = new client.Gauge({
  name: "timelord_jobs_running",
  help: "Jobs currently running on agents (statusCode -1)",
  registers: [register],
});

export const jobsCompletedTotal = new client.Counter({
  name: "timelord_jobs_completed_total",
  help: "Jobs finished by agents",
  labelNames: ["status_code", "final_state"] as const,
  registers: [register],
});

export const jobsDispatchedTotal = new client.Counter({
  name: "timelord_jobs_dispatched_total",
  help: "Jobs dispatched to agents",
  registers: [register],
});

export const jobsTimedOutTotal = new client.Counter({
  name: "timelord_jobs_timed_out_total",
  help: "Jobs timed out by the server",
  registers: [register],
});

export const jobQueueAddedTotal = new client.Counter({
  name: "timelord_job_queue_added_total",
  help: "Jobs added to the manual queue",
  registers: [register],
});

export const jobQueueClearedTotal = new client.Counter({
  name: "timelord_job_queue_cleared_total",
  help: "Jobs removed when clearing the manual queue",
  registers: [register],
});

export const gitRefreshTotal = new client.Counter({
  name: "timelord_git_refresh_total",
  help: "Git config refresh attempts",
  labelNames: ["result"] as const,
  registers: [register],
});

export const httpRequestsTotal = new client.Counter({
  name: "timelord_http_requests_total",
  help: "HTTP requests handled by the server",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [register],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: "timelord_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const prometheus = register;

export function recordJobCompletion(
  statusCode: number,
  finalState?: string,
): void {
  jobsCompletedTotal.inc({
    status_code: String(statusCode),
    final_state: finalState ?? "unknown",
  });
}

export function recordHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  durationSeconds: number,
): void {
  const labels = {
    method,
    route,
    status_code: String(statusCode),
  };

  httpRequestsTotal.inc(labels);
  httpRequestDurationSeconds.observe(labels, durationSeconds);
}
