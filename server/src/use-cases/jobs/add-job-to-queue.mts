import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";
import { jobQueueAddedTotal } from "../../tools/metrics.mts";

const payload = z.object({
  title: z.string(),
  userId: z.uuid(),
  hostname: z.string().optional(),
});

export async function addJobToQueue(
  request: FastifyRequest<{ Body: { title: string; hostname?: string } }>,
  reply: FastifyReply,
) {
  const store = getHumanStore();

  const { success, data, error } = payload.safeParse({
    title: request.body.title,
    userId: store.userId,
    hostname: request.body.hostname,
  });

  if (!success) {
    reply.status(422).send(error);
    return;
  }

  try {
    await prisma.jobQueue.create({
      data: {
        title: data.title,
        userId: data.userId,
        hostname: data.hostname?.toLowerCase() ?? "",
      },
    });

    jobQueueAddedTotal.inc();
  } catch (err) {
    logger.error(err);

    reply.statusCode = 400;
    reply.send({
      message: "It can only be add once",
    });
    return;
  }

  reply.send({
    message: "Job added to the queue",
  });
}
