import fs from "fs";
import path from "path";
import { simpleGit } from "simple-git";

import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import { env } from "../../tools/env.mts";
import { getSshFilePath } from "../../tools/setup-ssh.mts";

export async function refreshGitConfig() {
  logger.info("Start refreshing configs");

  const configs = await prisma.gitConfig.findMany({});

  for (const config of configs) {
    if (config.sshUrl) {
      if (!fs.existsSync(path.join(env.GIT_CONFIGS_REPOSITORY, config.name))) {
        logger.info(`Refreshing git config — clone ${config.name}`);
        await cloneRepo(
          config.name,
          config.sshUrl,
          getSshFilePath(config.name),
        );
      } else {
        const folder = path.join(env.GIT_CONFIGS_REPOSITORY, config.name);
        try {
          logger.info(`Refreshing git config — pull ${config.name}`);
          const gitFolder = simpleGit(folder);
          await gitFolder.pull();

          await prisma.gitConfig.update({
            data: {
              pullAt: new Date(),
            },
            where: {
              id: config.id,
            },
          });
        } catch (err) {
          logger.error(err);

          fs.rmSync(folder, { recursive: true, force: true });
          await cloneRepo(
            config.name,
            config.sshUrl,
            getSshFilePath(config.name),
          );
        }
      }
    }
  }
}

async function cloneRepo(name: string, sshUrl: string, sshKeyPath: string) {
  process.env.GIT_SSH_COMMAND = `ssh -i ${sshKeyPath} -o IdentitiesOnly=yes -o StrictHostKeyChecking=no`;

  try {
    const gitClient = simpleGit(env.GIT_CONFIGS_REPOSITORY, {});
    await gitClient.clone(sshUrl, name);
  } catch (err) {
    logger.error(err);
  }
}
