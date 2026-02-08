import { FastifyRequest } from "fastify";

import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";

export async function createSecret(
  request: FastifyRequest<{
    Body: { name: string; value: string };
  }>,
) {
  const { userId } = getHumanStore();

  await prisma.secret.create({
    data: {
      name: request.body.name,
      value: request.body.value,
      userId,
      lastRead: null,
    },
  });

  return "OK";
}
