import pino, { type LoggerOptions } from "pino";

import { env } from "./tools/env.mts";

const config: LoggerOptions = {
  level: env.LOG_LEVEL,
  base: null,
};

if (process.env.NODE_ENV !== "production") {
  config.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      levelFirst: true,
      singleLine: true,
      translateTime: "HH:MM:ss.l",
    },
  } satisfies LoggerOptions["transport"];
}

export const logger = pino(config);
