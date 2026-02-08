import { randomUUID } from "node:crypto";

import axios, { AxiosResponse } from "axios";
import fs from "fs";
import { beforeAll, describe, it } from "vitest";

import { prisma } from "../../../src/prisma-client.mts";
import { TEST_USER_ID } from "../../config/constants.mts";
import { generateGitConfig } from "../../entities/git-config.mts";

const masterTokenForAgent = randomUUID();
const jobId = randomUUID();

describe("when", () => {
  let response: AxiosResponse;

  beforeAll(async () => {
    await prisma.user.deleteMany();
    await prisma.user.create({
      data: {
        masterTokenForAgent,
        email: "user@timelord.org",
        id: TEST_USER_ID,
      },
    });
    await prisma.job.create({
      data: {
        id: jobId,
        title: "Job Name",
      },
    });

    const config = generateGitConfig({ name: "crons", userId: TEST_USER_ID });
    const configNotForMe = generateGitConfig({ name: "crons-not-me" });

    await prisma.gitConfig.deleteMany();
    await prisma.gitConfig.createMany({ data: [config, configNotForMe] });

    response = await axios({
      responseType: "stream",

      url: `http://localhost:18888/job/assets?jobId=${jobId}`,
      headers: {
        "Content-Type": "application/json",
        "X-Timelord-Agent-Token": masterTokenForAgent,
        "X-Timelord-Hostname": "Integration-Tests",
      },
    });
  });

  it("should have inserted the git-configs", async () => {
    const writer = fs.createWriteStream("toto.zip");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  });
});
