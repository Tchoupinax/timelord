import Fastify, { LogController } from "fastify";

import { logger } from "./logger.mts";
import { createLoggerOptions } from "./logger-config.mts";
import { router } from "./router.mts";
import { Store } from "./store.mts";
import {
  maskDatabaseUrl,
  resolveDatabaseUrl,
} from "./tools/database-url.mts";
import { env } from "./tools/env.mts";

declare module "@fastify/request-context" {
  interface RequestContextData {
    store: Store;
  }
}

export async function createServer() {
  const fastify = Fastify({
    bodyLimit: 1024 * 1024,
    logger: createLoggerOptions(env.LOG_LEVEL),
    logController: new LogController({ disableRequestLogging: true }),
  });

  fastify.addHook("onSend", async (_request, reply) => {
    reply.headers({
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Referrer-Policy": "no-referrer",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    });
  });

  await fastify.register(router);

  return fastify;
}

export async function startServer() {
  const server = await createServer();

  const port = env.PORT.defined ? env.PORT.value : 9988;

  try {
    await server.listen({ port, host: "0.0.0.0" });
    logger.info(
      { database: maskDatabaseUrl(resolveDatabaseUrl(env)) },
      `Listening on ${port}`,
    );
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  return server;
}
