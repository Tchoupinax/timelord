import type { FastifyReply, FastifyRequest } from "fastify";

import { prisma } from "../../prisma-client.mts";
import { getRobotStore } from "../../store.mts";

export async function agentHeartbeat(
  request: FastifyRequest<{
    Body: { version: string };
  }>,
  reply: FastifyReply,
) {
  const store = getRobotStore();

  if (!store.agentHostname || !store.userId) {
    reply.status(200);
    return;
  }

  await prisma.agent.upsert({
    where: {
      userId: store.userId,
      name: store.agentName,
    },
    create: {
      token: "",
      userId: store.userId,
      name: store.agentName,
      seenAt: new Date(),
      version: request.body.version,
    },
    update: {
      seenAt: new Date(),
      version: request.body.version,
    },
  });

  return "OK";
}
