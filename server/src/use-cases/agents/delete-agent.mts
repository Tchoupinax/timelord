import type { FastifyReply, FastifyRequest } from "fastify";

import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";

export async function deleteAgent(
  request: FastifyRequest<{
    Params: { name: string };
  }>,
  reply: FastifyReply,
) {
  try {
    const { userId } = getHumanStore();
    const { name } = request.params;

    logger.debug({ userId, name }, "deleteAgent");

    await prisma.agent.delete({
      where: {
        name: name,
        userId: userId,
      },
    });

    return "OK";
  } catch (err) {
    logger.error(err);
    reply.status(500).send("FAIL");
  }
}
