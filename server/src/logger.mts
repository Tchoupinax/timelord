import pino from "pino";

import { createLoggerOptions } from "./logger-config.mts";
import { env } from "./tools/env.mts";

export const logger = pino(createLoggerOptions(env.LOG_LEVEL));
