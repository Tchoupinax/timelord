import { randomUUID } from "node:crypto";

import axios from "axios";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../src/prisma-client.mts";
import { ORPHANED_JOB_STATUS_COMMENT } from "../../../src/use-cases/jobs/reconcile-stale-running-jobs.mts";
import { TEST_USER_ID } from "../../config/constants.mts";
import { E2E_PORT } from "../../config/e2e-env.mts";
import { generateJob } from "../../entities/job.mts";

const masterTokenForAgent = randomUUID();
const agentHostname = "runtime-test-agent";

const heartbeatUrl = `http://localhost:${E2E_PORT}/heartbeat`;
const jobUrl = `http://localhost:${E2E_PORT}/job`;

function runtimeAgentHeaders(params: {
  instanceId: string;
  activeJobId?: string;
}) {
  return {
    "Content-Type": "application/json",
    "X-Timelord-Agent-Token": masterTokenForAgent,
    "X-Timelord-Hostname": agentHostname,
    "X-Timelord-Agent-Instance-Id": params.instanceId,
    "X-Timelord-Active-Job-Id": params.activeJobId ?? "",
  };
}

async function postHeartbeat(params: {
  instanceId: string;
  activeJobId?: string;
}) {
  return axios.post(
    heartbeatUrl,
    { version: "1.0.0-e2e" },
    { headers: runtimeAgentHeaders(params) },
  );
}

describe("agent runtime instance (restart fingerprint)", () => {
  beforeAll(async () => {
    await prisma.log.deleteMany();
    await prisma.job.deleteMany();
    await prisma.agent.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.create({
      data: {
        email: "runtime-e2e@timelord.org",
        id: TEST_USER_ID,
        masterTokenForAgent,
      },
    });
  });

  afterAll(async () => {
    await prisma.log.deleteMany();
    await prisma.job.deleteMany();
    await prisma.agent.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(async () => {
    await prisma.log.deleteMany();
    await prisma.job.deleteMany();
    await prisma.agent.deleteMany();
  });

  it("stores the runtime instance id on first heartbeat (not a restart)", async () => {
    await postHeartbeat({ instanceId: "instance-first" });

    const agent = await prisma.agent.findUnique({
      where: { name: agentHostname },
    });
    expect(agent?.runtimeInstanceId).toBe("instance-first");
  });

  it("orphans running jobs when the runtime instance id changes (heartbeat)", async () => {
    const jobId = randomUUID();
    await prisma.agent.upsert({
      where: { name: agentHostname },
      create: {
        name: agentHostname,
        userId: TEST_USER_ID,
        token: "",
        runtimeInstanceId: "instance-before-restart",
      },
      update: {
        runtimeInstanceId: "instance-before-restart",
      },
    });

    await prisma.job.create({
      data: generateJob({
        id: jobId,
        userId: TEST_USER_ID,
        hostname: agentHostname,
        statusCode: -1,
        title: "Backup Immich library",
      }),
    });

    await postHeartbeat({ instanceId: "instance-after-restart" });

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    expect(job?.statusCode).toBe(1);
    expect(job?.statusComment).toBe(ORPHANED_JOB_STATUS_COMMENT);

    const agent = await prisma.agent.findUnique({
      where: { name: agentHostname },
    });
    expect(agent?.runtimeInstanceId).toBe("instance-after-restart");
  });

  it("keeps the running job when instance id is unchanged and activeJobId matches", async () => {
    const jobId = randomUUID();
    const instanceId = "instance-stable";

    await prisma.agent.upsert({
      where: { name: agentHostname },
      create: {
        name: agentHostname,
        userId: TEST_USER_ID,
        token: "",
        runtimeInstanceId: instanceId,
      },
      update: { runtimeInstanceId: instanceId },
    });

    await prisma.job.create({
      data: generateJob({
        id: jobId,
        userId: TEST_USER_ID,
        hostname: agentHostname,
        statusCode: -1,
        title: "Silent copy",
      }),
    });

    await postHeartbeat({ instanceId, activeJobId: jobId });

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    expect(job?.statusCode).toBe(-1);
  });

  it("orphans a stale running job when the agent polls for work after restart (GET /job)", async () => {
    const jobId = randomUUID();

    await prisma.agent.upsert({
      where: { name: agentHostname },
      create: {
        name: agentHostname,
        userId: TEST_USER_ID,
        token: "",
        runtimeInstanceId: "instance-old-poll",
      },
      update: { runtimeInstanceId: "instance-old-poll" },
    });

    await prisma.job.create({
      data: generateJob({
        id: jobId,
        userId: TEST_USER_ID,
        hostname: agentHostname,
        statusCode: -1,
        title: "Stuck after pod restart",
      }),
    });

    await axios.get(jobUrl, {
      headers: runtimeAgentHeaders({ instanceId: "instance-new-poll" }),
    });

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    expect(job?.statusCode).toBe(1);
    expect(job?.statusComment).toBe(ORPHANED_JOB_STATUS_COMMENT);
  });
});
