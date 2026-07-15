import { logger } from "../logger.mts";
import { prisma } from "../prisma-client.mts";
import {
  agentsOnline,
  agentsTotal,
  jobQueueDepth,
  jobsRunning,
} from "./metrics.mts";

const ONLINE_THRESHOLD_MS = 60 * 1000;
const COLLECT_INTERVAL_MS = 15 * 1000;

export async function collectDomainMetrics(): Promise<void> {
  const onlineSince = new Date(Date.now() - ONLINE_THRESHOLD_MS);

  const [online, total, queuedJobs, runningJobs] = await Promise.all([
    prisma.agent.count({
      where: {
        seenAt: {
          gte: onlineSince,
        },
      },
    }),
    prisma.agent.count(),
    prisma.jobQueue.count(),
    prisma.job.count({
      where: {
        statusCode: -1,
      },
    }),
  ]);

  agentsOnline.set(online);
  agentsTotal.set(total);
  jobQueueDepth.set(queuedJobs);
  jobsRunning.set(runningJobs);
}

export function startDomainMetricsCollector(): void {
  const collect = () => {
    void collectDomainMetrics().catch(error => {
      logger.error(error, "Failed to collect domain metrics");
    });
  };

  collect();
  setInterval(collect, COLLECT_INTERVAL_MS);
}
