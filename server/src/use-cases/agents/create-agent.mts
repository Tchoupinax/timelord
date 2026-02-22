import { randomUUID } from "node:crypto";

import type { FastifyReply, FastifyRequest } from "fastify";

import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";

export async function createAgent(
  request: FastifyRequest<{
    Body: { name: string };
  }>,
  reply: FastifyReply,
) {
  try {
    const store = getHumanStore();
    const token = randomUUID();

    if (!store.userId) {
      throw new Error("User id not found");
    }

    await prisma.agent.create({
      data: {
        name: request.body.name,
        userId: store.userId,
        token: token,
      },
    });

    return { token };
  } catch (err) {
    logger.error(err);
    reply.status(500).send("FAIL");
  }
}
