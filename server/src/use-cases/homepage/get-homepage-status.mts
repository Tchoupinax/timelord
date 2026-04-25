import { prisma } from "../../prisma-client.mts";

const ONLINE_THRESHOLD_MS = 60 * 1000;

type LatestJob = {
  finalState: string | null;
  statusCode: number | null;
  title: string | null;
  updatedAt: Date;
};

function getLastJobState(job: LatestJob | null): string {
  if (!job) {
    return "No jobs";
  }

  if (job.finalState) {
    return job.finalState;
  }

  if (job.statusCode === null) {
    return "Running";
  }

  return job.statusCode === 0 ? "Success" : "Error";
}

export async function getHomepageStatus() {
  const onlineSince = new Date(Date.now() - ONLINE_THRESHOLD_MS);

  const [agentsOnline, agentsTotal, queuedJobs, latestJob] = await Promise.all([
    prisma.agent.count({
      where: {
        seenAt: {
          gte: onlineSince,
        },
      },
    }),
    prisma.agent.count(),
    prisma.jobQueue.count(),
    prisma.job.findFirst({
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        finalState: true,
        statusCode: true,
        title: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    agentsOnline,
    agentsOffline: agentsTotal - agentsOnline,
    queuedJobs,
    lastJobState: getLastJobState(latestJob),
    lastJobTitle: latestJob?.title ?? null,
    lastJobUpdatedAt: latestJob?.updatedAt.toISOString() ?? null,
  };
}
