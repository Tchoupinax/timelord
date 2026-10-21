import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import axios from "axios";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../src/prisma-client.mts";
import { TEST_USER_ID } from "../../config/constants.mts";
import { E2E_PORT, e2eEnv } from "../../config/e2e-env.mts";
import { generateGitConfig } from "../../entities/git-config.mts";

const masterTokenForAgent = randomUUID();
const agentHostname = "crons-at-home";
const jobTitle = "Targeted queue job";
const enabledRepo = "e2e-crons";
const emptyRepo = "crons-empty";
const disabledRepo = "disabled-assets";

const jobUrl = `http://localhost:${E2E_PORT}/job`;
const queueUrl = `http://localhost:${E2E_PORT}/jobs/queue`;

const configuredRoot = e2eEnv.GIT_CONFIGS_REPOSITORY;
if (configuredRoot === undefined) {
  throw new Error("GIT_CONFIGS_REPOSITORY is not set");
}
const reposRoot: string = configuredRoot;

function assetDir(repoName: string): string {
  return path.join(reposRoot, repoName, "timelord-assets", jobTitle);
}

function agentHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Timelord-Agent-Token": masterTokenForAgent,
    "X-Timelord-Hostname": agentHostname,
  };
}

async function queueJob() {
  await axios.post(
    queueUrl,
    { title: jobTitle, hostname: agentHostname },
    { headers: { "Content-Type": "application/json" } },
  );
}

async function pollJob() {
  return axios.get<{
    id?: string;
    file?: string;
    message?: string;
    hasAssets?: boolean;
  }>(jobUrl, { headers: agentHeaders() });
}

async function downloadAssets(jobId: string) {
  return axios.get<ArrayBuffer>(`${jobUrl}/assets?jobId=${jobId}`, {
    headers: agentHeaders(),
    responseType: "arraybuffer",
    validateStatus: () => true,
  });
}

function writeAsset(repoName: string, filename: string, content: string) {
  const dir = assetDir(repoName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), content);
}

function removeAssetRepos() {
  for (const repoName of [enabledRepo, emptyRepo, disabledRepo]) {
    fs.rmSync(path.join(reposRoot, repoName, "timelord-assets"), {
      recursive: true,
      force: true,
    });
  }
  fs.rmSync(path.join(reposRoot, disabledRepo), { recursive: true, force: true });
  fs.rmSync(path.join(reposRoot, emptyRepo), { recursive: true, force: true });
}

function readZipEntry(body: Buffer, entryName: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "timelord-e2e-zip-"));
  const zipPath = path.join(dir, "assets.zip");
  fs.writeFileSync(zipPath, body);
  try {
    return execFileSync("unzip", ["-p", zipPath, entryName], {
      encoding: "utf8",
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe("job assets", () => {
  beforeAll(async () => {
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

    await prisma.gitConfig.createMany({
      data: [
        generateGitConfig({
          enabled: true,
          name: emptyRepo,
          userId: TEST_USER_ID,
        }),
        generateGitConfig({
          enabled: false,
          name: disabledRepo,
          userId: TEST_USER_ID,
        }),
        generateGitConfig({
          enabled: true,
          name: enabledRepo,
          userId: TEST_USER_ID,
        }),
      ],
    });
  });

  afterAll(async () => {
    removeAssetRepos();
    await prisma.jobQueue.deleteMany();
    await prisma.job.deleteMany();
    await prisma.gitConfig.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(async () => {
    removeAssetRepos();
    await prisma.jobQueue.deleteMany();
    await prisma.job.deleteMany();
  });

  it("reports no assets when only a disabled repository has a folder", async () => {
    writeAsset(disabledRepo, "secret.txt", "from-disabled");

    await queueJob();
    const response = await pollJob();

    expect(response.data.message).toBeUndefined();
    expect(response.data.id).toBeDefined();
    expect(response.data.hasAssets).toBe(false);

    const assets = await downloadAssets(response.data.id!);
    expect(assets.status).toBe(404);
    expect(JSON.parse(Buffer.from(assets.data).toString("utf8"))).toEqual({
      error: "No assets found",
    });
  });

  it("dispatches a zip from an enabled repository when another repository has no folder", async () => {
    writeAsset(enabledRepo, "note.txt", "from-enabled");

    await queueJob();
    const response = await pollJob();

    expect(response.data.message).toBeUndefined();
    expect(response.data.id).toBeDefined();
    expect(response.data.hasAssets).toBe(true);

    const assets = await downloadAssets(response.data.id!);
    expect(assets.status).toBe(200);
    expect(String(assets.headers["content-type"])).toContain("application/zip");

    const body = Buffer.from(assets.data);
    expect(body.subarray(0, 2).toString()).toBe("PK");
    expect(readZipEntry(body, "note.txt")).toBe("from-enabled");
  });
});
