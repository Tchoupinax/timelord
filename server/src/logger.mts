import pino, { type LoggerOptions } from "pino";

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
  } satisfies LoggerOptions["transport"];
}

export const logger = pino(config);
