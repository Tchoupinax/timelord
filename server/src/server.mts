import Fastify from "fastify";

import { createLoggerOptions } from "./logger-config.mts";
import { logger } from "./logger.mts";
import { router } from "./router.mts";
import { Store } from "./store.mts";
import { env } from "./tools/env.mts";

declare module "@fastify/request-context" {
  interface RequestContextData {
    store: Store;
  }
}

export async function createServer() {
  const fastify = Fastify({
    logger: createLoggerOptions(env.LOG_LEVEL),
    disableRequestLogging: true,
  });
  await fastify.register(router);

  return fastify;
}

export async function startServer() {
  const server = await createServer();

  const port = env.PORT.defined ? env.PORT.value : 9988;

  try {
    await server.listen({ port, host: "0.0.0.0" });
    logger.info(`Listening on ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
