import { randomUUID } from "node:crypto";

import type { GitConfig } from "#prisma";
import { extractMetadata, type Metadata } from "#src/functions/extract-metadata.mts";
import { logger } from "#src/logger.mts";
import { prisma } from "#src/prisma-client.mts";
import { getRobotStore } from "#src/store.mts";
import { env } from "#src/tools/env.mts";
import { jobsDispatchedTotal } from "#src/tools/metrics.mts";

import fs from "fs";

import {
  buildCronPeriodAttemptWhere,
  getCronPeriodStart,
} from "./cron-period.mts";
import {
  getActiveCronJobs,
  isCronPastStartWindow,
} from "./cron-priority.mts";
import { getSriptsByIdentity } from "./get-scripts-by-identity.mts";
import { injectSecret } from "./inject-secret.mts";
import { agentMatchesQueueTarget } from "./queue-target.mts";

export async function getJob() {
  const store = getRobotStore();

  const configs = await prisma.gitConfig.findMany({
    where: { userId: store.userId },
  });

  if (configs.length === 0) {
    return {
      message: "No git config found. Nothing to do here.",
    };
  }

  try {
    const id = randomUUID();
    const cronObject = await getOneJob(configs, store.agentHostname);

    await prisma.job.create({
      data: {
        cron: cronObject.cron,
        hostname: store?.agentHostname,
        id,
        nextPlannedExecution: cronObject.nextDate,
        statusCode: -1,
        title: cronObject.title,
        userId: store?.userId,
      },
    });

    if (cronObject.title && cronObject.keepLastCount > -1) {
      await removeLastNthJob(cronObject.title, cronObject.keepLastCount);
    }

    jobsDispatchedTotal.inc();

    return {
      id,
      file: Buffer.from(cronObject.file).toString("base64"),
      hasAssets: true,
    };
  } catch (err) {
    logger.error(err);
    return {
      message: `No script available for you ${store?.agentHostname}`,
    };
  }
}

type Cron = {
  file: string;
  title?: string;
  cron?: string;
  nextDate?: string;
  keepLastCount: number;
};

async function getOneJob(
  configs: Array<GitConfig>,
  identity: string,
): Promise<Cron> {
  const store = getRobotStore();

  const files = getSriptsByIdentity(configs, identity);
  if (files.length == 0) {
    throw new Error("No files detected for this identity");
  }

  const metadataFiles: Array<Metadata> = [];
  for (const f of files) {
    metadataFiles.push(extractMetadata(fs.readFileSync(f, "utf8")));
  }

  const agentRunningJob = await prisma.job.findFirst({
    where: {
      hostname: identity,
      userId: store.userId,
      statusCode: -1,
    },
  });

  if (agentRunningJob) {
    throw new Error(
      `Agent "${identity}" is busy with "${agentRunningJob.title}"`,
    );
  }

  const scheduledJob = await trySelectCronJob(metadataFiles, files, identity);
  if (scheduledJob) {
    if (scheduledJob.title) {
      await deleteMatchingQueueEntries({
        userId: store.userId,
        title: scheduledJob.title,
        agentIdentity: identity,
      });
    }

    return scheduledJob;
  }

  const queuedJobs = await prisma.jobQueue.findMany({
    where: {
      userId: store.userId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  for (const queuedJob of queuedJobs) {
    if (!agentMatchesQueueTarget(identity, queuedJob.hostname)) {
      continue;
    }

    const job = metadataFiles.find(metadata => metadata.title === queuedJob.title);
    if (!job) {
      continue;
    }

    const jobIndex = metadataFiles.findIndex(metadata => metadata.title === queuedJob.title);
    logger.info(`Queued job detected "${queuedJob.title}" for "${identity}"`);

    try {
      const file = await injectSecret(
        fs.readFileSync(files[jobIndex] as string, "utf8"),
      );

      await prisma.jobQueue.delete({
        where: {
          jobId: {
            title: queuedJob.title,
            userId: store.userId,
            hostname: queuedJob.hostname,
          },
        },
      });

      return {
        file,
        title: job.title,
        cron: "Manual",
        nextDate: job.nextDate,
        keepLastCount: job.keepLastCount ?? -1,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(
        { err: error, jobTitle: job.title },
        "Queued job could not be prepared",
      );

      await markJobAsSelectionError({
        cron: "Manual",
        nextDate: job.nextDate,
        title: job.title,
        errorMessage,
      });
      await prisma.jobQueue.delete({
        where: {
          jobId: {
            title: queuedJob.title,
            userId: store.userId,
            hostname: queuedJob.hostname,
          },
        },
      });
      return await getOneJob(configs, identity);
    }
  }

  throw new Error(
    `No cron object was found for this agent, aborting ... (${identity})`,
  );
}

async function deleteMatchingQueueEntries({
  userId,
  title,
  agentIdentity,
}: {
  userId: string;
  title: string;
  agentIdentity: string;
}) {
  const entries = await prisma.jobQueue.findMany({
    where: {
      title,
      userId,
    },
  });

  for (const entry of entries) {
    if (!agentMatchesQueueTarget(agentIdentity, entry.hostname)) {
      continue;
    }

    await prisma.jobQueue.delete({
      where: {
        jobId: {
          title: entry.title,
          userId: entry.userId,
          hostname: entry.hostname,
        },
      },
    });
  }
}

async function trySelectCronJob(
  metadataFiles: Array<Metadata>,
  files: Array<string>,
  identity: string,
): Promise<Cron | null> {
  const store = getRobotStore();
  const now = new Date();
  const startWindowMinutes = env.CRON_START_WINDOW_MINUTES;

  for (const { metadata, index } of getActiveCronJobs(metadataFiles, {
    now,
    startWindowMinutes,
  })) {
    const job = await prisma.job.findFirst({
      where: {
        userId: store.userId,
        hostname: identity,
        title: metadata.title,
        statusCode: -1,
      },
    });

    if (!job) {
      const periodStart = getCronPeriodStart(metadata);
      const alreadyStartedJob = periodStart
        ? await prisma.job.findFirst({
            where: buildCronPeriodAttemptWhere({
              userId: store.userId,
              hostname: identity,
              title: metadata.title,
              periodStart,
            }),
          })
        : null;

      if (!alreadyStartedJob) {
        try {
          const file = await injectSecret(
            fs.readFileSync(files[index] as string, "utf8"),
          );

          if (
            isCronPastStartWindow(metadata, startWindowMinutes, now)
          ) {
            logger.warn(
              {
                jobTitle: metadata.title,
                cron: metadata.cron,
                periodStart: metadata.nextDate,
              },
              "Scheduled job started after the configured start window",
            );
          }

          return {
            file,
            title: metadata.title,
            cron: metadata.cron,
            nextDate: metadata.nextDate,
            keepLastCount: metadata.keepLastCount ?? -1,
          };
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          logger.error(
            { err: error, jobTitle: metadata.title },
            "Scheduled job could not be prepared",
          );
          await markJobAsSelectionError({
            cron: metadata.cron,
            nextDate: metadata.nextDate,
            title: metadata.title,
            errorMessage,
          });
        }
      }
    } else {
      logger.debug(`Same job in progress detected, aborted (${job.title})`);
    }
  }

  return null;
}

async function removeLastNthJob(jobTitle: string, keeplastCount: number) {
  const store = getRobotStore();

  try {
    const lastItems = await prisma.job.findMany({
      orderBy: {
        createdAt: "desc",
      },
      where: {
        title: jobTitle,
        userId: store.userId,
      },
      take: keeplastCount,
      select: {
        id: true,
      },
    });

    const idsToKeep = lastItems.map(item => item.id);
    await prisma.job.deleteMany({
      where: {
        title: jobTitle,
        userId: store.userId,
        id: {
          notIn: idsToKeep,
        },
      },
    });

    logger.info("Deleted all items except the last five.");
  } catch (error) {
    logger.error(error, "Error removing queued jobs");
  }
}

type MarkJobAsSelectionErrorPayload = {
  title?: string;
  cron?: string;
  nextDate?: string;
  errorMessage: string;
};

async function markJobAsSelectionError({
  title,
  cron,
  nextDate,
  errorMessage,
}: MarkJobAsSelectionErrorPayload) {
  const store = getRobotStore();

  if (!title) {
    return;
  }

  const existingJobWithSameFailure = await prisma.job.findFirst({
    where: {
      userId: store.userId,
      title,
      cron: cron ?? null,
      nextPlannedExecution: nextDate ?? null,
      statusCode: 1,
      statusComment: errorMessage,
    },
    select: {
      id: true,
    },
  });
  if (existingJobWithSameFailure) {
    return;
  }

  await prisma.job.create({
    data: {
      cron: cron ?? null,
      hostname: store?.agentHostname,
      nextPlannedExecution: nextDate ?? null,
      statusCode: 1,
      statusComment: errorMessage,
      title,
      userId: store?.userId,
    },
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
