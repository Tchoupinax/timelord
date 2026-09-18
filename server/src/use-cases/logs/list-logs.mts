import { FastifyReply, FastifyRequest } from "fastify";

import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";
import { env } from "../../tools/env.mts";

export type ListLogsResponse = {
  content: string;
  maxLogIndex: number;
  jobRunning: boolean;
};

export async function listLogs(
  request: FastifyRequest<{
    Querystring: { jobId: string; afterIndex?: string; format?: string };
  }>,
  reply: FastifyReply,
): Promise<string | ListLogsResponse> {
  const { userId } = getHumanStore();

  const { jobId, afterIndex: afterIndexRaw } = request.query;
  const userScope = env.DISABLE_AUTHENTICATION ? {} : { userId };

  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      ...userScope,
    },
    select: { statusCode: true },
  });

  if (!job) {
    reply.status(404);
    return "";
  }

  const logWhere = {
    jobId,
    ...userScope,
  };

  const maxIndexResult = await prisma.log.aggregate({
    where: logWhere,
    _max: { index: true },
  });
  const maxIndex = maxIndexResult._max.index ?? -1;

  const jobRunning = job.statusCode === -1;

  reply.header("X-Max-Log-Index", String(maxIndex));
  reply.header("X-Job-Running", jobRunning ? "true" : "false");
  reply.header(
    "Access-Control-Expose-Headers",
    "X-Max-Log-Index, X-Job-Running",
  );

  const afterIndex =
    afterIndexRaw !== undefined ? parseInt(afterIndexRaw, 10) : undefined;

  const logs = await prisma.log.findMany({
    where: {
      ...logWhere,
      ...(afterIndex !== undefined && !Number.isNaN(afterIndex)
        ? { index: { gt: afterIndex } }
        : {}),
    },
    select: { content: true },
    orderBy: { index: "asc" },
  });

  const content = logs.map(log => log.content).join("\n");

  if (request.query.format === "json") {
    return { content, maxLogIndex: maxIndex, jobRunning };
  }

  return content;
}
