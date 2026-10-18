import fs from "fs";
import path from "path";
import type { SimpleGit } from "simple-git";
import { simpleGit } from "simple-git";

import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import { env } from "../../tools/env.mts";
import { gitRefreshTotal } from "../../tools/metrics.mts";
import { getSshFilePath } from "../../tools/setup-ssh.mts";

export async function refreshGitConfig() {
  logger.info("Start refreshing configs");

  const configs = await prisma.gitConfig.findMany({});

  for (const config of configs) {
    if (config.sshUrl) {
      const sshKeyPath = getSshFilePath(config.name);
      if (!fs.existsSync(path.join(env.GIT_CONFIGS_REPOSITORY, config.name))) {
        logger.info(
          `Refreshing git config — clone ${config.sshUrl} into ${config.name}`,
        );
        await cloneRepo(config.id, config.name, config.sshUrl, sshKeyPath);
      } else {
        const folder = path.join(env.GIT_CONFIGS_REPOSITORY, config.name);
        try {
          logger.info(
            `Refreshing git config — pull ${config.sshUrl} in ${config.name}`,
          );
          const gitFolder = openGit(folder, config.sshUrl, sshKeyPath);
          await gitFolder.pull();

          const log = await gitFolder.log({ maxCount: 1 });
          const latestCommit = log.latest;

          await prisma.gitConfig.update({
            data: {
              pullAt: new Date(),
              lastCommitSha: latestCommit?.hash ?? null,
              lastCommitMessage: latestCommit?.message ?? null,
            },
            where: {
              id: config.id,
            },
          });
          gitRefreshTotal.inc({ result: "success" });
        } catch (err) {
          logger.error(err);
          gitRefreshTotal.inc({ result: "failure" });

          fs.rmSync(folder, { recursive: true, force: true });
          await cloneRepo(
            config.id,
            config.name,
            config.sshUrl,
            getSshFilePath(config.name),
          );
        }
      }
    }
  }
}

function usesSshTransport(sshUrl: string) {
  return !sshUrl.startsWith("file:");
}

// simple-git 4 strips ambient GIT_* variables from the git child unless they
// are named here. Passing them through .env() instead is rejected whenever
// the process also has EDITOR, PAGER, or another guarded variable set.
// The key file is the git config's key; the repository is config.sshUrl.
function openGit(
  baseDir: string,
  sshUrl: string,
  sshKeyPath: string,
): SimpleGit {
  if (usesSshTransport(sshUrl)) {
    process.env.GIT_SSH_COMMAND = `ssh -i ${sshKeyPath} -o IdentitiesOnly=yes -o StrictHostKeyChecking=no`;
  } else {
    delete process.env.GIT_SSH_COMMAND;
  }

  return simpleGit(baseDir, {
    allowEnvironment: ["GIT_SSH_COMMAND"],
  });
}

async function cloneRepo(
  configId: string,
  name: string,
  sshUrl: string,
  sshKeyPath: string,
) {
  try {
    const gitClient = openGit(env.GIT_CONFIGS_REPOSITORY, sshUrl, sshKeyPath);
    await gitClient.clone(sshUrl, name);

    const clonedFolder = path.join(env.GIT_CONFIGS_REPOSITORY, name);
    const log = await openGit(clonedFolder, sshUrl, sshKeyPath).log({
      maxCount: 1,
    });
    const latestCommit = log.latest;

    await prisma.gitConfig.update({
      data: {
        pullAt: new Date(),
        lastCommitSha: latestCommit?.hash ?? null,
        lastCommitMessage: latestCommit?.message ?? null,
      },
      where: { id: configId },
    });
    gitRefreshTotal.inc({ result: "success" });
  } catch (err) {
    logger.error(err);
    gitRefreshTotal.inc({ result: "failure" });
  }
}
