import { logger } from "./logger.mts";
import { prisma, waitForDatabase } from "./prisma-client.mts";
import { startServer } from "./server.mts";
import { startDomainMetricsCollector } from "./tools/collect-domain-metrics.mts";
import { reclaimLeasedQueueJobs } from "./use-cases/jobs/reclaim-leased-jobs.mts";
import { timeoutOldJobs } from "./use-cases/jobs/timeout-old-jobs.mts";

const MINUTES = 1000 * 60;

const timeoutInterval = setInterval(() => {
  // A rejection here must never take the whole process down as an unhandled
  // rejection; log it and let the next tick retry.
  timeoutOldJobs().catch(err => {
    logger.error({ err }, "Failed to timeout old jobs");
  });

  // Redeliver queued jobs whose dispatch never completed (at-least-once).
  reclaimLeasedQueueJobs().catch(err => {
    logger.error({ err }, "Failed to reclaim leased queue jobs");
  });
}, 1 * MINUTES);

await waitForDatabase();

startDomainMetricsCollector();

const server = await startServer();

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  logger.info({ signal }, "Shutting down gracefully");

  clearInterval(timeoutInterval);

  // Give in-flight requests a bounded window to finish before we force exit.
  const forceExit = setTimeout(() => {
    logger.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    await server.close();
    await prisma.$disconnect();
    logger.info("Shutdown complete");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during shutdown");
    process.exit(1);
  }
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}

process.on("unhandledRejection", reason => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", err => {
  logger.fatal({ err }, "Uncaught exception, shutting down");
  void shutdown("uncaughtException");
});
