import fs from "node:fs";

import type { FastifyReply, FastifyRequest } from "fastify";

import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";
import { env } from "../../tools/env.mts";

const gitConfigSelect = {
  id: true,
  createdAt: true,
  enabled: true,
  folderNameInGitRepository: true,
  lastCommitSha: true,
  lastCommitMessage: true,
  name: true,
  pullAt: true,
  sshUrl: true,
  updatedAt: true,
} as const;

export async function updateGitConfig(
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      sshUrl?: string;
      folderNameInGitRepository?: string;
      enabled?: boolean;
      sshPrivateKey?: string;
    };
  }>,
  reply: FastifyReply,
) {
  const { userId } = getHumanStore();
  const { id } = request.params;
  const { sshUrl, folderNameInGitRepository, enabled, sshPrivateKey } =
    request.body;

  const existing = await prisma.gitConfig.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    reply.status(404).send("Not found");
    return;
  }

  const data: {
    sshUrl?: string;
    folderNameInGitRepository?: string;
    enabled?: boolean;
    sshPrivateKey?: string;
  } = {};

  if (sshUrl !== undefined) {
    data.sshUrl = sshUrl;
  }
  if (folderNameInGitRepository !== undefined) {
    data.folderNameInGitRepository = folderNameInGitRepository;
  }
  if (enabled !== undefined) {
    data.enabled = enabled;
  }
  if (sshPrivateKey) {
    data.sshPrivateKey = Buffer.from(sshPrivateKey).toString("base64");

    const keyPath = `${env.SSH_KEYS_REPOSITORY}/${existing.name}.key`;
    fs.writeFileSync(keyPath, sshPrivateKey);
    fs.chmodSync(keyPath, "600");
  }

  const updated = await prisma.gitConfig.update({
    data,
    select: gitConfigSelect,
    where: { id },
  });

  reply.send(updated);
}
