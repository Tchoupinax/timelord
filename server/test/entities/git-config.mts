import { randomUUID } from "node:crypto";

import { GitConfig } from "#prisma";

export function generateGitConfig(
  override: Partial<GitConfig> = {},
): GitConfig {
  return {
    createdAt: new Date(),
    enabled: true,
    folderNameInGitRepository: "timelord",
    id: randomUUID(),
    name: "name",
    pullAt: new Date(),
    sshPrivateKey: "RSA KEY",
    sshUrl: "git://github.com/Tchoupinax/toto.git",
    updatedAt: new Date(),
    userId: randomUUID(),
    ...override,
  };
}
