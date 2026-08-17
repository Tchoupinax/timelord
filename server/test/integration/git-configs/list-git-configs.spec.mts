import { randomUUID } from "node:crypto";

import { type GitConfig } from "#prisma";

import axios from "axios";
import { beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../../../src/prisma-client.mts";
import { TEST_USER_ID } from "../../config/constants.mts";
import { generateGitConfig } from "../../entities/git-config.mts";

describe("when listing git configs", () => {
  let gitConfigs: unknown;
  let config: GitConfig;

  beforeAll(async () => {
    await prisma.gitConfig.deleteMany();
    config = generateGitConfig({ name: randomUUID(), userId: TEST_USER_ID });
    const configNotForMe = generateGitConfig({ name: randomUUID() });
    await prisma.gitConfig.createMany({ data: [config, configNotForMe] });

    ({ data: gitConfigs } = await axios<{ data: unknown }>({
      url: "http://localhost:18888/git-configs",
      headers: {
        "Content-Type": "application/json",
      },
    }));
  });

  it("should have inserted the git-configs", () => {
    expect(gitConfigs).toEqual([
      {
        createdAt: config.createdAt.toISOString(),
        enabled: true,
        folderNameInGitRepository: "timelord",
        id: config.id,
        lastCommitMessage: config.lastCommitMessage,
        lastCommitSha: config.lastCommitSha,
        name: config.name,
        pullAt: config.pullAt?.toISOString(),
        sshUrl: config.sshUrl,
        updatedAt: config.updatedAt.toISOString(),
      },
    ]);
  });
});
