import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import axios from "axios";
import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "../../../src/prisma-client.mts";
import { TEST_USER_ID } from "../../config/constants.mts";
import { E2E_PORT } from "../../config/e2e-env.mts";
import { generateGitConfig } from "../../entities/git-config.mts";

const masterTokenForAgent = randomUUID();
const agentHostname = "log-e2e-agent";
const jobTitle = "Backup gitea logs";

const queueUrl = `http://127.0.0.1:${E2E_PORT}/jobs/queue`;
const logsUrl = `http://127.0.0.1:${E2E_PORT}/logs`;

const serverRoot = path.resolve(import.meta.dirname, "../../..");
const agentDir = path.resolve(serverRoot, "../agent");
const agentBinary = path.join(os.tmpdir(), `timelord-agent-e2e-${process.pid}`);

const expectedLogs = [
  ...Array.from({ length: 20 }, (_, index) => `backup line ${index + 1}`),
  "Transferred: 1%",
  "Transferred: 100%",
  "backup finished",
];

type LogsPayload = {
  entries?: Array<{ content: string; index: number }>;
};

function spawnAgent(): ChildProcess {
  return spawn(agentBinary, [], {
    env: {
      ...process.env,
      AGENT_AUTO_UPDATE: "false",
      AGENT_HOSTNAME: agentHostname,
      AGENT_MASTER_TOKEN: masterTokenForAgent,
      API_URL: `http://127.0.0.1:${E2E_PORT}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function waitForLogs(jobId: string): Promise<string[]> {
  const deadline = Date.now() + 25_000;
  let contents: string[] = [];

  while (Date.now() < deadline) {
    const response = await axios.get<LogsPayload>(logsUrl, {
      params: { format: "json", jobId, tail: 1000 },
      validateStatus: () => true,
    });
    contents = response.data.entries?.map(entry => entry.content) ?? [];
    if (contents.length === expectedLogs.length) {
      return contents;
    }
    await sleep(200);
  }

  return contents;
}

describe("job logs", () => {
  afterAll(async () => {
    fs.rmSync(agentBinary, { force: true });
    await prisma.log.deleteMany();
    await prisma.jobQueue.deleteMany();
    await prisma.job.deleteMany();
    await prisma.gitConfig.deleteMany();
    await prisma.user.deleteMany();
  });

  it("stores every stdout line pushed by the agent", async () => {
    execFileSync("go", ["build", "-o", agentBinary, "."], {
      cwd: agentDir,
      stdio: "inherit",
      timeout: 120_000,
    });

    await prisma.log.deleteMany();
    await prisma.jobQueue.deleteMany();
    await prisma.job.deleteMany();
    await prisma.gitConfig.deleteMany();
    await prisma.user.deleteMany();

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

    await axios.post(
      queueUrl,
      { hostname: agentHostname, title: jobTitle },
      { headers: { "Content-Type": "application/json" } },
    );

    const agent = spawnAgent();
    let agentOutput = "";
    agent.stdout?.on("data", chunk => {
      agentOutput += String(chunk);
    });
    agent.stderr?.on("data", chunk => {
      agentOutput += String(chunk);
    });

    try {
      const deadline = Date.now() + 20_000;
      let jobId = "";
      while (Date.now() < deadline && jobId === "") {
        const job = await prisma.job.findFirst({
          where: { hostname: agentHostname, title: jobTitle },
          select: { id: true },
        });
        jobId = job?.id ?? "";
        if (jobId === "") {
          await sleep(200);
        }
      }

      expect(jobId, agentOutput).not.toBe("");

      const contents = await waitForLogs(jobId);
      expect(contents, agentOutput).toEqual(expectedLogs);

      const rows = await prisma.log.findMany({
        where: { jobId },
        orderBy: { index: "asc" },
        select: { content: true, index: true, type: true },
      });
      expect(rows.map(row => row.index)).toEqual(
        expectedLogs.map((_, index) => index),
      );
      expect(rows.every(row => row.type === "STDOUT")).toBe(true);
    } finally {
      agent.kill("SIGTERM");
      const exited = await Promise.race([
        new Promise(resolve => agent.once("exit", resolve)),
        sleep(2_000).then(() => "timeout"),
      ]);
      if (exited === "timeout") {
        agent.kill("SIGKILL");
      }
    }
  }, 60_000);
});
