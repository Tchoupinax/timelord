import { FastifyReply, FastifyRequest } from "fastify";

import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";
import { env } from "../../tools/env.mts";

export type ActivityItem = {
  id: string;
  type: "job_running" | "job_succeeded" | "job_failed" | "job_started" | "job_queued";
  title: string;
  message: string;
  timestamp: string;
  jobId?: string;
  hostname?: string | null;
  statusComment?: string | null;
};

export async function listActivity(
  request: FastifyRequest<{
    Querystring: {
      limit?: string;
    };
  }>,
  reply: FastifyReply,
) {
  const store = getHumanStore();
  const limit = request.query.limit ? parseInt(request.query.limit, 10) : 100;

  const userFilter = env.DISABLE_AUTHENTICATION ? {} : { userId: store.userId };

  const [jobs, queuedJobs] = await Promise.all([
    prisma.job.findMany({
      where: userFilter,
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        hostname: true,
        createdAt: true,
        updatedAt: true,
        statusCode: true,
        statusComment: true,
        finalState: true,
      },
    }),
    prisma.jobQueue.findMany({
      where: userFilter,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        title: true,
        createdAt: true,
      },
    }),
  ]);

  const activities: ActivityItem[] = [];

  for (const job of jobs) {
    const title = job.title ?? "Untitled job";

    if (job.statusCode === -1) {
      activities.push({
        id: `${job.id}-running`,
        type: "job_running",
        title,
        message: `Running on ${job.hostname ?? "unknown agent"}`,
        timestamp: job.createdAt.toISOString(),
        jobId: job.id,
        hostname: job.hostname,
      });
      continue;
    }

    activities.push({
      id: `${job.id}-started`,
      type: "job_started",
      title,
      message: `Started on ${job.hostname ?? "unknown agent"}`,
      timestamp: job.createdAt.toISOString(),
      jobId: job.id,
      hostname: job.hostname,
    });

    if (job.statusCode === 0) {
      activities.push({
        id: `${job.id}-finished`,
        type: "job_succeeded",
        title,
        message: job.finalState ?? "Completed successfully",
        timestamp: job.updatedAt.toISOString(),
        jobId: job.id,
        hostname: job.hostname,
        statusComment: job.statusComment,
      });
    } else {
      activities.push({
        id: `${job.id}-finished`,
        type: "job_failed",
        title,
        message:
          job.statusComment ??
          `Failed with exit code ${job.statusCode ?? "unknown"}`,
        timestamp: job.updatedAt.toISOString(),
        jobId: job.id,
        hostname: job.hostname,
        statusComment: job.statusComment,
      });
    }
  }

  for (const queuedJob of queuedJobs) {
    activities.push({
      id: `queue-${queuedJob.title}-${queuedJob.createdAt.toISOString()}`,
      type: "job_queued",
      title: queuedJob.title,
      message: "Waiting in queue",
      timestamp: queuedJob.createdAt.toISOString(),
    });
  }

  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  reply.send({
    activities: activities.slice(0, limit),
  });
}
