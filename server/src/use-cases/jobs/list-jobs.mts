import { randomUUID } from "node:crypto";

import { type Job } from "#prisma";

import { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import path from "path";

import { extractMetadata } from "../../functions/extract-metadata.mts";
import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";
import { env } from "../../tools/env.mts";
import { queueTargetMatchesJobHostname } from "./get-job/queue-target.mts";

type ExternalJob = Job & {
  neverExecuted: boolean;
  keepLastCount: number;
  timezone?: string;
  timezoneInvalid?: boolean;
};

export async function listJobs(
  request: FastifyRequest<{
    Querystring: {
      page: string;
      limit: string;
    };
  }>,
  reply: FastifyReply,
) {
  const store = getHumanStore();

  const { page, limit } = request.query;

  const jobs = await prisma.job.findMany({
    orderBy: {
      createdAt: "desc",
    },
    where: env.DISABLE_AUTHENTICATION
      ? {}
      : {
          userId: store.userId,
        },
    take: limit ? parseInt(limit, 10) : 100,
    skip: page ? parseInt(page, 10) * 100 : 0,
  });

  // We list jobs but we need to list cronjobs from Git because
  // we also want to list never-started-jobs for a better overview
  const configs = await prisma.gitConfig.findMany({
    where: { userId: store.userId },
  });

  const folders = configs
    // Only use repositories enabled
    .filter(c => c.enabled)
    .map(c =>
      path.join(
        env.GIT_CONFIGS_REPOSITORY,
        c.name,
        c.folderNameInGitRepository,
      ),
    );

  let subFolders: Array<string> = [];
  for (const folder of folders) {
    if (fs.existsSync(folder)) {
      subFolders = [
        ...subFolders,
        ...fs.readdirSync(folder).map(file => `${folder}/${file}`),
      ];
    }
  }

  // Skip stray files next to agent folders and nested directories: reading
  // them threw and turned the whole listing into a 500 (empty dashboard).
  let files: Array<string> = [];
  for (const folder of subFolders) {
    if (fs.existsSync(folder) && fs.statSync(folder).isDirectory()) {
      files = [
        ...files,
        ...fs
          .readdirSync(folder)
          .map(file => `${folder}/${file}`)
          .filter(file => fs.statSync(file).isFile()),
      ];
    }
  }

  const jobsFromGit: Array<ExternalJob> = files.flatMap(file => {
    let metadata: ReturnType<typeof extractMetadata>;
    try {
      metadata = extractMetadata(fs.readFileSync(file, "utf-8"));
    } catch (error) {
      // One unreadable script (e.g. invalid cron) must not hide every job.
      logger.warn({ err: error, file }, "Could not read job script metadata");
      return [];
    }
    return {
      id: randomUUID(),
      createdAt: new Date(),
      title: metadata.title,
      cron: metadata.cron ?? null,
      updatedAt: new Date(),
      hostname: file.split("/").at(-2) ?? null,
      nextPlannedExecution: null,
      statusCode: -1,
      statusComment: "",
      cancelRequestedAt: null,
      userId: "",
      neverExecuted: true,
      keepLastCount: metadata.keepLastCount ?? 0,
      timezone: metadata.timezone,
      timezoneInvalid: metadata.timezoneInvalid,
      finalState: null,
      jobTimeoutMinutes: null,
    } satisfies ExternalJob;
  });

  const returnedJob: Array<ExternalJob> = [
    ...jobs.map(j => ({ ...j, neverExecuted: false }) as ExternalJob),
    ...jobsFromGit.map(j => ({ ...j, neverExecuted: true })),
  ];

  const queuedJobs = await prisma.jobQueue.findMany();

  reply.send({
    jobs: returnedJob.map(job => {
      const foundJob = queuedJobs.find(
        queuedJob =>
          queuedJob.title === job.title &&
          queueTargetMatchesJobHostname(queuedJob.hostname, job.hostname),
      );
      if (foundJob) {
        return {
          ...job,
          queuePending: true,
        };
      }

      return {
        ...job,
        queuePending: false,
      };
    }),
    jobsCount: jobs.length,
    jobMetadatas: jobsFromGit.reduce<
      Record<string, { keepLastCount: number; timezone: string; timezoneInvalid: boolean }>
    >((acc, cur) => {
      acc[cur.title ?? ""] = {
        keepLastCount: cur.keepLastCount,
        timezone: cur.timezone ?? "",
        timezoneInvalid: cur.timezoneInvalid ?? false,
      };
      return acc;
    }, {}),
  });
}
