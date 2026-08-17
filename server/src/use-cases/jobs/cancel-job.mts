import type { FastifyReply, FastifyRequest } from "fastify";

import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";
import { env } from "../../tools/env.mts";
import { jobsCancelRequestedTotal } from "../../tools/metrics.mts";

export async function cancelJob(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const store = getHumanStore();
  const { id } = request.params;

  const job = await prisma.job.findFirst({
    where: env.DISABLE_AUTHENTICATION
      ? { id }
      : {
          id,
          userId: store.userId,
        },
  });

  if (!job) {
    reply.status(404).send({ message: "Job not found" });
    return;
  }

  if (job.statusCode !== -1) {
    reply.status(409).send({ message: "Job is not running" });
    return;
  }

  if (job.cancelRequestedAt) {
    reply.send({ message: "Job cancellation already requested" });
    return;
  }

  await prisma.job.update({
    where: { id: job.id },
    data: {
      cancelRequestedAt: new Date(),
    },
  });

  jobsCancelRequestedTotal.inc();

  reply.send({ message: "Job cancellation requested" });
}
