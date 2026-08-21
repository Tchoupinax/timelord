import { randomUUID } from "node:crypto";

import axios from "axios";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../../../src/prisma-client.mts";
import { TEST_USER_ID } from "../../config/constants.mts";
import { E2E_PORT } from "../../config/e2e-env.mts";
import { generateGitConfig } from "../../entities/git-config.mts";

const masterTokenForAgent = randomUUID();
const targetAgent = "crons-at-home";
const otherAgent = "other-agent";
const jobTitle = "Targeted queue job";

const jobUrl = `http://localhost:${E2E_PORT}/job`;
const queueUrl = `http://localhost:${E2E_PORT}/jobs/queue`;

function agentHeaders(hostname: string) {
  return {
    "Content-Type": "application/json",
    "X-Timelord-Agent-Token": masterTokenForAgent,
    "X-Timelord-Hostname": hostname,
  };
}

async function requestJob(hostname: string) {
  return axios.get<{ id?: string; file?: string; message?: string }>(jobUrl, {
    headers: agentHeaders(hostname),
  });
}

describe("when a queued job targets a specific agent", () => {
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

  it("keeps the queue entry when a different agent polls", async () => {
    await prisma.job.deleteMany();
    await prisma.jobQueue.deleteMany();

    await axios.post(
      queueUrl,
      { title: jobTitle, hostname: targetAgent },
      { headers: { "Content-Type": "application/json" } },
    );

    const response = await requestJob(otherAgent);

    expect(response.data.id).toBeUndefined();
    expect(response.data.message).toContain("No script available");
    expect(await prisma.jobQueue.count()).toBe(1);
  });

  it("serves the queued job to the targeted agent", async () => {
    await prisma.job.deleteMany();
    await prisma.jobQueue.deleteMany();

    await axios.post(
      queueUrl,
      { title: jobTitle, hostname: targetAgent },
      { headers: { "Content-Type": "application/json" } },
    );

    const response = await requestJob(targetAgent);

    expect(response.data.id).toBeDefined();
    expect(response.data.file).toBeDefined();
    expect(await prisma.jobQueue.count()).toBe(0);

    const createdJob = await prisma.job.findUnique({
      where: { id: response.data.id },
    });
    expect(createdJob?.hostname).toBe(targetAgent);
    expect(createdJob?.cron).toBe("Manual");
  });

  it("matches the targeted agent folder case-insensitively", async () => {
    await prisma.job.deleteMany();
    await prisma.jobQueue.deleteMany();

    await axios.post(
      queueUrl,
      { title: jobTitle, hostname: targetAgent },
      { headers: { "Content-Type": "application/json" } },
    );

    const response = await requestJob("Crons-At-Home");

    expect(response.data.id).toBeDefined();
    expect(await prisma.jobQueue.count()).toBe(0);
  });
});
