import { randomUUID } from "crypto";
import { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import path from "path";

import { extractMetadata } from "../../functions/extract-metadata.mts";
import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";
import { env } from "../../tools/env.mts";
import { type Job } from "#prisma";

type ExternalJob = Job & {
  neverExecuted: boolean;
  keepLastCount: number;
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

  let files: Array<string> = [];
  for (const folder of subFolders) {
    if (fs.existsSync(folder)) {
      files = [
        ...files,
        ...fs.readdirSync(folder).map(file => {
          return `${folder}/${file}`;
        }),
      ];
    }
  }

  const jobsFromGit: Array<ExternalJob> = files.map(file => {
    const metadata = extractMetadata(fs.readFileSync(file, "utf-8"));
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
      userId: "",
      neverExecuted: true,
      keepLastCount: metadata.keepLastCount ?? 0,
    } satisfies ExternalJob;
  });

  const returnedJob: Array<ExternalJob> = [
    ...jobs.map(j => ({ ...j, neverExecuted: false }) as ExternalJob),
    ...jobsFromGit.map(j => ({ ...j, neverExecuted: true }) as ExternalJob),
  ];

  const queuedJobs = await prisma.jobQueue.findMany();

  reply.send({
    jobs: returnedJob.map(job => {
      const foundJob = queuedJobs.find(qj => qj.title === job.title);
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
    jobMetadatas: jobsFromGit.reduce((acc, cur) => {
      return {
        ...acc,

        [cur.title ?? ""]: cur.keepLastCount,
      };
    }, {}),
  });
}
