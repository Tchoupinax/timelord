import type { FastifyReply, FastifyRequest } from "fastify";

import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";

export async function listGitConfigs(_: FastifyRequest, reply: FastifyReply) {
  const { userId } = getHumanStore();

  const configs = await prisma.gitConfig.findMany({
    select: {
      createdAt: true,
      enabled: true,
      folderNameInGitRepository: true,
      name: true,
      pullAt: true,
      sshUrl: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
    where: {
      userId,
    },
  });

  reply.send(configs);
}
