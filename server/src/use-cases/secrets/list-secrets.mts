import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";

export async function listSecrets() {
  const { userId } = getHumanStore();

  const secrets = await prisma.secret.findMany({
    select: {
      name: true,
      value: true,
      createdAt: true,
      updatedAt: true,
      lastRead: true,
    },
    orderBy: { name: "asc" },
    where: {
      userId,
    },
  });

  return secrets;
}
