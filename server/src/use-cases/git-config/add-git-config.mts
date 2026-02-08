import fs from "node:fs";

import { type FastifyRequest } from "fastify";

import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";
import { env } from "../../tools/env.mts";

export async function addGitConfig(
  request: FastifyRequest<{
    Body: { name: string; sshUrl: string; sshPrivateKey: string };
  }>,
) {
  const { userId } = getHumanStore();

  const { name, sshUrl, sshPrivateKey } = request.body;

  const sshPrivateKeyBase64 = Buffer.from(sshPrivateKey).toString("base64");

  await prisma.gitConfig.create({
    data: {
      userId: userId,
      enabled: true,
      name: name,
      sshPrivateKey: sshPrivateKeyBase64,
      sshUrl,
    },
  });

  const fileName = `${env.SSH_KEYS_REPOSITORY}/${name}.key`;
  fs.writeFileSync(fileName, sshPrivateKey);
  fs.chmodSync(fileName, "600");

  return "OK";
}
