import type { LoggerOptions } from "pino";

export const serviceName = "timelord-server";

export function createLoggerOptions(level: string): LoggerOptions {
  return {
    level,
    base: { service: serviceName },
    messageKey: "_msg",
    timestamp: () => `,"_time":"${new Date().toISOString()}"`,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  };
}
