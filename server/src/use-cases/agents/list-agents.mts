import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";
import { env } from "../../tools/env.mts";

export async function listAgents() {
  const { userId } = getHumanStore();

  logger.debug({ userId }, "listAgents");

  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      version: true,
      seenAt: true,
    },
    where: env.DISABLE_AUTHENTICATION
      ? {}
      : {
          userId: userId,
        },
    orderBy: {
      seenAt: {
        sort: "desc",
      },
    },
  });

  return agents;
}
