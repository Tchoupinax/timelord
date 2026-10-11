import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import {
  jobQueueExhaustedTotal,
  jobQueueRedeliveredTotal,
} from "../../tools/metrics.mts";

/**
 * Reconciles leased queue entries against their dispatched job. An entry stays
 * leased (invisible) while its job runs; once the job reaches a terminal state
 * the lease is resolved:
 *   - success: the completion handler already deleted the entry.
 *   - failed / lost / timed out: redeliver while attempts remain, else drop.
 *
 * This is what turns the queue into at-least-once delivery: a job that was
 * dispatched but never completed (crash, lost response, orphaned agent) is made
 * visible again instead of being silently lost.
 */
export async function reclaimLeasedQueueJobs(): Promise<void> {
  const leased = await prisma.jobQueue.findMany({
    where: { NOT: { leasedAt: null } },
  });

  for (const entry of leased) {
    const where = {
      jobId: {
        title: entry.title,
        userId: entry.userId,
        hostname: entry.hostname,
      },
    };

    const job = entry.leasedJobId
      ? await prisma.job.findUnique({
          where: { id: entry.leasedJobId },
          select: { statusCode: true },
        })
      : null;

    // Job still running: leave the lease in place. The job lifecycle
    // (timeout/orphan reconciliation) flips it to a terminal state eventually.
    if (job && job.statusCode === -1) {
      continue;
    }

    // Job succeeded but the completion handler did not clear the entry (rare):
    // drop it, do not redeliver.
    if (job && job.statusCode === 0) {
      await prisma.jobQueue.delete({ where });
      continue;
    }

    // Job failed, timed out, orphaned, or its record is gone: the delivery did
    // not succeed.
    if (entry.attempts < entry.maxAttempts) {
      await prisma.jobQueue.update({
        where,
        data: { leasedAt: null, leasedJobId: null },
      });
      jobQueueRedeliveredTotal.inc();
      logger.warn(
        {
          title: entry.title,
          hostname: entry.hostname,
          attempts: entry.attempts,
          maxAttempts: entry.maxAttempts,
        },
        "Redelivering queued job after failed or lost delivery",
      );
    } else {
      await prisma.jobQueue.delete({ where });
      jobQueueExhaustedTotal.inc();
      logger.warn(
        {
          title: entry.title,
          hostname: entry.hostname,
          attempts: entry.attempts,
        },
        "Dropping queued job after exhausting delivery attempts",
      );
    }
  }
}
