import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { recordHttpRequest } from "../tools/metrics.mts";

type MetricsRequest = FastifyRequest & {
  metricsStartMs?: number;
};

function getRoute(request: FastifyRequest): string {
  return request.routeOptions?.url ?? request.url.split("?")[0] ?? "unknown";
}

export function registerHttpMetrics(fastify: FastifyInstance): void {
  fastify.addHook("onRequest", (request: MetricsRequest, _reply, done) => {
    request.metricsStartMs = Date.now();
    done();
  });

  fastify.addHook(
    "onResponse",
    (request: MetricsRequest, reply: FastifyReply, done) => {
      const durationSeconds = request.metricsStartMs
        ? (Date.now() - request.metricsStartMs) / 1000
        : 0;

      recordHttpRequest(
        request.method,
        getRoute(request),
        reply.statusCode,
        durationSeconds,
      );

      done();
    },
  );
}
