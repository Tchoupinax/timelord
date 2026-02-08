import { FastifyRequest } from "fastify";

import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";

export async function listLogs(
  request: FastifyRequest<{
    Querystring: { jobId: string };
  }>,
) {
  const { userId } = getHumanStore();

  const { jobId } = request.query;

  const logs = await prisma.log.findMany({
    where: {
      jobId: jobId,
      userId,
    },
    select: { content: true },
    orderBy: { index: "asc" },
  });

  return logs.map(log => log.content).join("\n");
}
