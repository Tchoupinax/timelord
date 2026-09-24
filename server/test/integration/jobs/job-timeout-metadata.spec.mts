import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import axios from "axios";
import dayjs from "dayjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { extractMetadata } from "../../../src/functions/extract-metadata.mts";
import { prisma } from "../../../src/prisma-client.mts";
import { timeoutOldJobs } from "../../../src/use-cases/jobs/timeout-old-jobs.mts";
import { TEST_USER_ID } from "../../config/constants.mts";
import { E2E_PORT } from "../../config/e2e-env.mts";
import { generateGitConfig } from "../../entities/git-config.mts";
import { generateJob } from "../../entities/job.mts";

const masterTokenForAgent = randomUUID();
const agentHostname = "Integration-Tests";
const jobTitle = "Job timeout metadata test";

const fixturePath = path.join(
  process.cwd(),
  "test/fixtures/git-configs/e2e-crons/timelord/Integration-Tests/job-timeout-metadata-test.sh",
);

const agentHeaders = {
  "Content-Type": "application/json",
  "X-Timelord-Agent-Token": masterTokenForAgent,
  "X-Timelord-Hostname": agentHostname,
};

const jobUrl = `http://localhost:${E2E_PORT}/job`;

async function requestJob() {
  return axios.get<{ id?: string; file?: string; message?: string }>(jobUrl, {
    headers: agentHeaders,
  });
}

describe("job timeout metadata (#>> Timeout:)", () => {
  beforeAll(async () => {
    await prisma.log.deleteMany();
    await prisma.job.deleteMany();
    await prisma.jobQueue.deleteMany();
    await prisma.gitConfig.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.create({
      data: {
        email: "job-timeout-e2e@timelord.org",
        id: TEST_USER_ID,
        masterTokenForAgent,
      },
    });

    await prisma.gitConfig.create({
      data: generateGitConfig({
        enabled: true,
        name: "e2e-crons",
        userId: TEST_USER_ID,
      }),
    });
  });

  afterAll(async () => {
    await prisma.log.deleteMany();
    await prisma.jobQueue.deleteMany();
    await prisma.job.deleteMany();
    await prisma.gitConfig.deleteMany();
    await prisma.user.deleteMany();
  });

  it("extracts Timeout from the fixture script", () => {
    const script = fs.readFileSync(fixturePath, "utf8");
    const metadata = extractMetadata(script);

    expect(metadata.jobTimeout).toBe("12h");
    expect(metadata.title).toBe(jobTitle);
  });

  it("stores job_timeout_minutes when dispatching a queued job", async () => {
    await prisma.job.deleteMany();
    await prisma.jobQueue.deleteMany();

    await axios.post(
      `http://localhost:${E2E_PORT}/jobs/queue`,
      { title: jobTitle, hostname: agentHostname },
      { headers: { "Content-Type": "application/json" } },
    );

    const response = await requestJob();

    expect(response.data.id).toBeDefined();
    expect(response.data.file).toBeDefined();

    const dispatched = await prisma.job.findUnique({
      where: { id: response.data.id },
    });

    expect(dispatched?.jobTimeoutMinutes).toBe(12 * 60);
    expect(dispatched?.title).toBe(jobTitle);
    expect(dispatched?.statusCode).toBe(-1);

    await axios.post(
      jobUrl,
      { id: response.data.id, statusCode: 0 },
      { headers: agentHeaders },
    );
  });

  it("timeout-old-jobs uses per-job limit instead of the global default", async () => {
    await prisma.job.deleteMany();

    const longRunningId = randomUUID();
    const defaultLimitId = randomUUID();
    const createdAt = dayjs().subtract(90, "minute").toDate();

    await prisma.job.createMany({
      data: [
        generateJob({
          id: longRunningId,
          userId: TEST_USER_ID,
          hostname: agentHostname,
          statusCode: -1,
          title: "long backup",
          createdAt,
          updatedAt: createdAt,
          jobTimeoutMinutes: 12 * 60,
        }),
        generateJob({
          id: defaultLimitId,
          userId: TEST_USER_ID,
          hostname: agentHostname,
          statusCode: -1,
          title: "short cron",
          createdAt,
          updatedAt: createdAt,
          jobTimeoutMinutes: null,
        }),
      ],
    });

    await timeoutOldJobs();

    const longRunning = await prisma.job.findUnique({
      where: { id: longRunningId },
    });
    const defaultLimit = await prisma.job.findUnique({
      where: { id: defaultLimitId },
    });

    expect(longRunning?.statusCode).toBe(-1);
    expect(defaultLimit?.statusCode).toBe(1);
    expect(defaultLimit?.statusComment).toBe("Job has timeout");
  });
});
