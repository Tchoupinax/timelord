import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import { jobsOrphanedTotal } from "../../tools/metrics.mts";

export const ORPHANED_JOB_STATUS_COMMENT =
  "Agent stopped or restarted while the job was running";

export async function orphanAllRunningJobsForHost(
  userId: string,
  hostname: string,
): Promise<void> {
  const running = await prisma.job.findMany({
    where: { userId, hostname, statusCode: -1 },
    select: { id: true, title: true },
  });

  for (const job of running) {
    logger.warn(
      { jobId: job.id, title: job.title, hostname },
      "Orphaning running job after agent runtime restart",
    );
    await failOrphanedRunningJob(job.id);
  }
}

export async function failOrphanedRunningJob(jobId: string): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      statusCode: 1,
      statusComment: ORPHANED_JOB_STATUS_COMMENT,
      cancelRequestedAt: null,
    },
  });
  jobsOrphanedTotal.inc();
}

/**
 * The agent reports which job (if any) it is executing. Any other running job on
 * the same host is orphaned — covers pod restarts mid-run. Long silent phases
 * (e.g. copying a large file) are safe as long as the agent still reports the id.
 */
export async function reconcileRunningJobsForAgent(params: {
  userId: string;
  hostname: string;
  activeJobId?: string | null;
}): Promise<void> {
  const activeJobId = params.activeJobId?.trim() || null;

  const running = await prisma.job.findMany({
    where: {
      userId: params.userId,
      hostname: params.hostname,
      statusCode: -1,
    },
    select: { id: true, title: true },
  });

  for (const job of running) {
    if (activeJobId && job.id === activeJobId) {
      continue;
    }

    logger.warn(
      { jobId: job.id, title: job.title, activeJobId },
      "Orphaning running job — not reported as active by agent",
    );
    await failOrphanedRunningJob(job.id);
  }
}
