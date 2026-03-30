import { randomUUID } from "node:crypto";

import type { GitConfig } from "#prisma";

import fs from "fs";

import { extractMetadata } from "../../../functions/extract-metadata.mts";
import { logger } from "../../../logger.mts";
import { prisma } from "../../../prisma-client.mts";
import { getRobotStore } from "../../../store.mts";
import { getSriptsByIdentity } from "./get-scripts-by-identity.mts";
import { injectSecret } from "./inject-secret.mts";

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

    return {
      id,
      file: Buffer.from(cronObject.file).toString("base64"),
      hasAssets: true,
    };
  } catch (err) {
    // @ts-expect-error legacy
    logger.error(err.message);
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

  // Firstly, we check if a job was queued for this userId.
  const queuedJob = await prisma.jobQueue.findFirst({
    where: {
      userId: store.userId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      title: true,
    },
  });

  const files = getSriptsByIdentity(configs, identity);
  if (files.length == 0) {
    throw new Error("No files detected for this identity");
  }

  // Extract all file metadata to have an overview
  const metadataFiles = [];
  for (const f of files) {
    metadataFiles.push(extractMetadata(fs.readFileSync(f, "utf8")));
  }

  const cronObject: Cron = {
    file: "",
    cron: "",
    title: "",
    nextDate: "",
    keepLastCount: -1,
  };

  if (queuedJob && metadataFiles.map(m => m.title).includes(queuedJob?.title)) {
    const agentRunningJob = await prisma.job.findFirst({
      where: {
        hostname: identity,
        userId: store.userId,
        statusCode: -1,
      },
    });

    if (agentRunningJob) {
      logger.debug(
        `Agent "${identity}" already has a running job ("${agentRunningJob.title}"), queue job "${queuedJob.title}" will not be taken`,
      );
    } else {
      logger.info(`Queued job detected "${queuedJob.title}"`);

      const job = metadataFiles.find(m => m.title === queuedJob.title)!;
      const jobIndex = metadataFiles.findIndex(m => m.title === queuedJob.title);

      cronObject.title = job.title;
      cronObject.cron = "Manual";
      cronObject.nextDate = job.nextDate;
      cronObject.keepLastCount = job.keepLastCount ?? -1;
      cronObject.file = await injectSecret(
        fs.readFileSync(files[jobIndex] as string, "utf8"),
      );

      await prisma.jobQueue.delete({
        where: {
          jobId: {
            title: job.title,
            userId: store.userId,
          },
        },
      });

      return cronObject;
    }
  }

  for (const [index, metadata] of metadataFiles.entries()) {
    if (metadata.cronIsActive) {
      const job = await prisma.job.findFirst({
        where: {
          userId: store.userId,
          title: metadata.title,
          statusCode: -1,
        },
      });

      // We continue only if there is no job in progress
      if (!job) {
        // Want to check if another job has already been started during the same cron period.
        // If it's the case, we do not want to restart the cron
        const alreadyStartedJob = await prisma.job.findFirst({
          where: {
            userId: store.userId,
            title: metadata.title,
            cron: metadata.cron,
            nextPlannedExecution: metadata.nextDate,
          },
        });

        if (!alreadyStartedJob) {
          cronObject.title = metadata.title;
          cronObject.cron = metadata.cron;
          cronObject.nextDate = metadata.nextDate;
          cronObject.keepLastCount = metadata.keepLastCount ?? -1;
          cronObject.file = await injectSecret(
            fs.readFileSync(files[index] as string, "utf8"),
          );

          break;
        }
      } else {
        logger.debug(`Same job in progress detected, aborted (${job.title})`);
      }
    }
  }

  if (!cronObject.title) {
    throw new Error(
      `No cron object was found for this agent, aborting ... (${identity})`,
    );
  }
  if (!cronObject.file) {
    throw new Error("No file in the cron job");
  }

  return cronObject;
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
    console.error("Error removing items:", error);
  }
}
