import type { FastifyReply, FastifyRequest } from "fastify";

import { prisma } from "../../prisma-client.mts";
import { getRobotStore } from "../../store.mts";

export async function getJobCancelStatus(
  request: FastifyRequest<{ Querystring: { jobId: string } }>,
  reply: FastifyReply,
) {
  const store = getRobotStore();
  const { jobId } = request.query;

  if (!jobId) {
    reply.status(400).send({ message: "jobId is required" });
    return;
  }

  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      userId: store.userId,
      hostname: store.agentHostname,
    },
    select: {
      cancelRequestedAt: true,
    },
  });

  if (!job) {
    reply.status(404).send({ message: "Job not found" });
    return;
  }

  reply.send({
    cancelRequested: job.cancelRequestedAt !== null,
  });
}
