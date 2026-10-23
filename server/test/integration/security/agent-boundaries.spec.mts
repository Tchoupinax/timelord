import { randomUUID } from "node:crypto";

import axios from "axios";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../../../src/prisma-client.mts";
import { E2E_PORT } from "../../config/e2e-env.mts";
import { generateJob } from "../../entities/job.mts";

const baseUrl = `http://127.0.0.1:${E2E_PORT}`;
const ownerId = randomUUID();
const attackerId = randomUUID();
const attackerToken = randomUUID();
const hostname = "security-e2e-agent";
const foreignJobId = randomUUID();

const agentHeaders = {
  "Content-Type": "application/json",
  "X-Timelord-Agent-Token": attackerToken,
  "X-Timelord-Hostname": hostname,
};

describe("agent security boundaries", () => {
  beforeAll(async () => {
    await prisma.log.deleteMany();
    await prisma.jobQueue.deleteMany();
    await prisma.job.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.createMany({
      data: [
        {
          email: "job-owner@timelord.test",
          id: ownerId,
          masterTokenForAgent: randomUUID(),
        },
        {
          email: "attacker@timelord.test",
          id: attackerId,
          masterTokenForAgent: attackerToken,
        },
      ],
    });
    await prisma.job.create({
      data: generateJob({
        hostname,
        id: foreignJobId,
        statusCode: -1,
        title: "Foreign backup",
        userId: ownerId,
      }),
    });
  });

  afterAll(async () => {
    await prisma.log.deleteMany();
    await prisma.jobQueue.deleteMany();
    await prisma.job.deleteMany();
    await prisma.user.deleteMany();
  });

  it("rejects unauthenticated agent requests", async () => {
    const response = await axios.get(`${baseUrl}/job`, {
      validateStatus: () => true,
    });

    expect(response.status).toBe(401);
    expect(response.data).toEqual({ msg: "Not authorized" });
  });

  it("does not let an agent overwrite another user's job result", async () => {
    const response = await axios.post(
      `${baseUrl}/job`,
      { id: foreignJobId, statusCode: 0 },
      { headers: agentHeaders, validateStatus: () => true },
    );

    expect(response.status).toBe(404);
    expect(response.data).toEqual({ msg: "Job not found" });
    expect(
      await prisma.job.findUnique({
        where: { id: foreignJobId },
        select: { statusCode: true },
      }),
    ).toEqual({ statusCode: -1 });
  });

  it("does not let an agent add logs to another user's job", async () => {
    const response = await axios.post(
      `${baseUrl}/logs`,
      {
        content: "forged log",
        createdAt: new Date().toISOString(),
        index: 0,
        jobId: foreignJobId,
        type: "STDOUT",
      },
      { headers: agentHeaders, validateStatus: () => true },
    );

    expect(response.status).toBe(404);
    expect(response.data).toEqual({ msg: "Job not found" });
    expect(await prisma.log.count({ where: { jobId: foreignJobId } })).toBe(0);
  });

  it("does not let an agent download another user's job assets", async () => {
    const response = await axios.get(`${baseUrl}/job/assets`, {
      headers: agentHeaders,
      params: { jobId: foreignJobId },
      validateStatus: () => true,
    });

    expect(response.status).toBe(404);
    expect(response.data).toEqual({ error: "No job found" });
  });

  it("adds defensive response headers", async () => {
    const response = await axios.get(`${baseUrl}/health`);

    expect(response.headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("DENY");
    expect(response.headers["referrer-policy"]).toBe("no-referrer");
  });
});
