import Fastify from "fastify";
import { LoggerOptions } from "pino";

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
  const config: LoggerOptions = {
    level: "debug",
    base: null,
  };

  if (process.env.NODE_ENV !== "production") {
    config.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        levelFirst: true,
        translateTime: "HH:MM:ss.l",
      },
    };
  }

  const fastify = Fastify({ logger: config });
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
