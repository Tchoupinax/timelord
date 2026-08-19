import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import axios from "axios";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { extractMetadata } from "../../../src/functions/extract-metadata.mts";
import { prisma } from "../../../src/prisma-client.mts";
import { E2E_PORT } from "../../config/e2e-env.mts";
import { TEST_USER_ID } from "../../config/constants.mts";
import { generateGitConfig } from "../../entities/git-config.mts";

const masterTokenForAgent = randomUUID();
const agentHostname = "Integration-Tests";
const jobTitle = "Cancel test job";
const CANCEL_EXIT_CODE = 130;

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

async function completeJob(jobId: string, statusCode: number, statusComment?: string) {
  await axios.post(
    jobUrl,
    {
      id: jobId,
      statusCode,
      statusComment,
    },
    { headers: agentHeaders },
  );
}

describe("when a cron job was cancelled in the current period", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany();
    await prisma.job.deleteMany();
    await prisma.jobQueue.deleteMany();
    await prisma.gitConfig.deleteMany();

    await prisma.user.create({
      data: {
        email: "user@timelord.org",
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
    await prisma.jobQueue.deleteMany();
    await prisma.job.deleteMany();
    await prisma.gitConfig.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should not dispatch the same cron job again after a user cancellation", async () => {
    await prisma.job.deleteMany();
    await prisma.jobQueue.deleteMany();

    const firstResponse = await requestJob();

    expect(firstResponse.data.id).toBeDefined();
    expect(firstResponse.data.file).toBeDefined();

    await completeJob(
      firstResponse.data.id!,
      CANCEL_EXIT_CODE,
      "Cancelled by user",
    );

    const secondResponse = await requestJob();

    expect(secondResponse.data.id).toBeUndefined();
    expect(secondResponse.data.message).toContain("No script available");
  });

  it("should not redispatch after queueing a cron job that was cancelled in the current period", async () => {
    await prisma.job.deleteMany();
    await prisma.jobQueue.deleteMany();

    await axios.post(
      `http://localhost:${E2E_PORT}/jobs/queue`,
      { title: jobTitle },
      { headers: { "Content-Type": "application/json" } },
    );

    expect(await prisma.jobQueue.count()).toBe(1);

    const firstResponse = await requestJob();

    expect(firstResponse.data.id).toBeDefined();
    expect(await prisma.jobQueue.count()).toBe(0);

    const dispatchedJob = await prisma.job.findUnique({
      where: { id: firstResponse.data.id },
    });
    expect(dispatchedJob?.cron).toBe("0 * * * *");

    await completeJob(
      firstResponse.data.id!,
      CANCEL_EXIT_CODE,
      "Cancelled by user",
    );

    const secondResponse = await requestJob();

    expect(secondResponse.data.id).toBeUndefined();
    expect(secondResponse.data.message).toContain("No script available");
    expect(await prisma.jobQueue.count()).toBe(0);
  });

  it("should dispatch a new cron job when the previous cancellation belongs to an earlier period", async () => {
    await prisma.job.deleteMany();
    await prisma.jobQueue.deleteMany();

    const script = fs.readFileSync(
      path.join(
        process.cwd(),
        "test/fixtures/git-configs/e2e-crons/timelord/Integration-Tests/cancel-test.sh",
      ),
      "utf8",
    );
    const metadata = extractMetadata(script);
    const periodStart = metadata.nextDate
      ? new Date(metadata.nextDate)
      : new Date();
    const previousPeriodStart = new Date(periodStart.getTime() - 60 * 60 * 1000);

    await prisma.job.create({
      data: {
        id: randomUUID(),
        createdAt: previousPeriodStart,
        updatedAt: previousPeriodStart,
        cron: "0 * * * *",
        hostname: agentHostname,
        nextPlannedExecution: previousPeriodStart.toISOString(),
        statusCode: CANCEL_EXIT_CODE,
        statusComment: "Cancelled by user",
        title: jobTitle,
        userId: TEST_USER_ID,
      },
    });

    const response = await requestJob();

    expect(response.data.id).toBeDefined();
    expect(response.data.file).toBeDefined();
  });
});
