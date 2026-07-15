import type { FastifyReply, FastifyRequest } from "fastify";

import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import { jobQueueClearedTotal } from "../../tools/metrics.mts";

export async function clearJobQueue(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const result = await prisma.jobQueue.deleteMany({});
    logger.info(`Job queue cleared: ${result.count} entries removed`);
    jobQueueClearedTotal.inc(result.count);
    reply.send({ message: "Queue cleared", clearedCount: result.count });
  } catch (err) {
    logger.error(err);
    reply.status(500).send({ message: "Failed to clear queue" });
  }
}
