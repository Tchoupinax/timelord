import { FastifyReply, FastifyRequest } from "fastify";

import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";
import { env } from "../../tools/env.mts";

const MAX_TAIL = 10_000;
const MAX_PAGE = 2_000;

export type LogEntry = {
  index: number;
  content: string;
};

export type ListLogsResponse = {
  content: string;
  entries: LogEntry[];
  maxLogIndex: number;
  minLogIndex: number;
  totalLogCount: number;
  hasOlder: boolean;
  jobRunning: boolean;
};

export async function listLogs(
  request: FastifyRequest<{
    Querystring: {
      jobId: string;
      afterIndex?: string;
      beforeIndex?: string;
      tail?: string;
      limit?: string;
      format?: string;
    };
  }>,
  reply: FastifyReply,
): Promise<string | ListLogsResponse> {
  const { userId } = getHumanStore();

  const { jobId, afterIndex: afterIndexRaw, beforeIndex: beforeIndexRaw } =
    request.query;
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

  const [maxIndexResult, totalLogCount] = await Promise.all([
    prisma.log.aggregate({
      where: logWhere,
      _max: { index: true },
    }),
    prisma.log.count({ where: logWhere }),
  ]);
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
  const beforeIndex =
    beforeIndexRaw !== undefined ? parseInt(beforeIndexRaw, 10) : undefined;
  const tail =
    request.query.tail !== undefined
      ? Math.min(parseInt(request.query.tail, 10), MAX_TAIL)
      : undefined;
  const limit =
    request.query.limit !== undefined
      ? Math.min(parseInt(request.query.limit, 10), MAX_PAGE)
      : 500;

  type Row = { content: string; index: number };

  let logs: Row[] = [];
  let hasOlder = false;

  if (afterIndex !== undefined && !Number.isNaN(afterIndex)) {
    logs = await prisma.log.findMany({
      where: {
        ...logWhere,
        index: { gt: afterIndex },
      },
      select: { content: true, index: true },
      orderBy: { index: "asc" },
    });
  } else if (beforeIndex !== undefined && !Number.isNaN(beforeIndex)) {
    const chunk = await prisma.log.findMany({
      where: {
        ...logWhere,
        index: { lt: beforeIndex },
      },
      select: { content: true, index: true },
      orderBy: { index: "desc" },
      take: Number.isNaN(limit) ? 500 : limit,
    });
    logs = chunk.reverse();
    hasOlder = logs.length > 0 && logs[0]!.index > 0;
  } else if (tail !== undefined && !Number.isNaN(tail) && tail > 0) {
    const startIndex = Math.max(0, maxIndex - tail + 1);
    logs = await prisma.log.findMany({
      where: {
        ...logWhere,
        index: { gte: startIndex },
      },
      select: { content: true, index: true },
      orderBy: { index: "asc" },
    });
    hasOlder = startIndex > 0;
  } else {
    logs = await prisma.log.findMany({
      where: logWhere,
      select: { content: true, index: true },
      orderBy: { index: "asc" },
    });
  }

  const entries: LogEntry[] = logs.map(log => ({
    index: log.index,
    content: log.content,
  }));
  const content = entries.map(entry => entry.content).join("\n");
  const minLogIndex = entries[0]?.index ?? -1;

  if (request.query.format === "json") {
    return {
      content,
      entries,
      maxLogIndex: maxIndex,
      minLogIndex,
      totalLogCount,
      hasOlder,
      jobRunning,
    };
  }

  return content;
}
