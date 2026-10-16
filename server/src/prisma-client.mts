import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../prisma/generated/prisma/index.js";
import { logger } from "./logger.mts";
import { resolveDatabaseUrl } from "./tools/database-url.mts";
import { env } from "./tools/env.mts";

const adapter = new PrismaPg({ connectionString: resolveDatabaseUrl(env) });
const prismaClient = new PrismaClient({ adapter });

export const prisma = prismaClient;

/**
 * Wait for the database to accept connections before serving traffic. The DB
 * often starts slightly after the server (compose/k8s), so a few retries with
 * backoff avoid a crash loop during startup.
 */
export async function waitForDatabase(
  maxAttempts = 10,
  baseDelayMs = 1_000,
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info("Database connection established");
      return;
    } catch (err) {
      if (attempt === maxAttempts) {
        logger.error({ err, attempt }, "Database unreachable, giving up");
        throw err;
      }

      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), 30_000);
      logger.warn(
        { err, attempt, maxAttempts, delayMs: delay },
        "Database not ready, retrying",
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
