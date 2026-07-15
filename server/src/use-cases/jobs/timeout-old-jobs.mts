// I want to check every job that is not finished
// and timeout it if it lived too long

import dayjs from "dayjs";

import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import { jobsTimedOutTotal } from "../../tools/metrics.mts";

export async function timeoutOldJobs(): Promise<void> {
  logger.info("Timeout old jobs");

  const jobs = await prisma.job.findMany({
    where: {
      statusCode: -1,
    },
  });

  for (const job of jobs) {
    const diff = dayjs().diff(dayjs(job.createdAt), "m");
    if (diff > 30) {
      logger.debug(job, "Job found");

      await prisma.job.update({
        where: { id: job.id },
        data: { statusCode: 1, statusComment: "Job has timeout" },
      });

      jobsTimedOutTotal.inc();

      logger.debug("Update done");
    }
  }
}
