import fs from "fs";

import { logger } from "../logger.mts";
import { prisma } from "../prisma-client.mts";
import { env } from "./env.mts";

export async function setupSSH() {
  logger.info("Setup SSH");

  const configs = await prisma.gitConfig.findMany({});

  for (const config of configs) {
    const name = `${env.SSH_KEYS_REPOSITORY}/${config.name}.key`;
    fs.writeFileSync(
      name,
      Buffer.from(config.sshPrivateKey, "base64").toString(),
    );
    fs.chmodSync(name, "600");
  }
}

export function getSshFilePath(name: string): string {
  return `${env.SSH_KEYS_REPOSITORY}/${name}.key`;
}
