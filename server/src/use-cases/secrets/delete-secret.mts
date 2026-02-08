import { FastifyRequest } from "fastify";

import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";

export async function deleteSecret(
  request: FastifyRequest<{
    Body: { name: string };
  }>,
) {
  const { userId } = getHumanStore();

  await prisma.secret.delete({
    where: {
      name: request.body.name,
      userId,
    },
  });

  return "OK";
}
