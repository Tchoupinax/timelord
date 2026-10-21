import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Writable } from "node:stream";

import type { FastifyReply } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import { generateGitConfig } from "../../../test/entities/git-config.mts";
import { generateJob } from "../../../test/entities/job.mts";
import {
  asFastifyReply,
  createReply,
  createRequestWithQuery,
} from "../../../test/utils/fastify-mock.mts";
import { prisma } from "../../__mocks__/prisma-client.mts";
import { env } from "../../tools/env.mts";
import { getJobAssets, listJobAssetDirectories } from "./get-job-assets.mts";

vi.mock("../../prisma-client");
vi.mock("../../logger.mts", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));
vi.mock("../../store.mts", () => ({
  getRobotStore: () => ({
    agentHostname: "gitea",
    agentName: "gitea",
    isHuman: false,
    isRobot: true,
    userId: "user-1",
  }),
}));

const created: string[] = [];

afterEach(() => {
  for (const folder of created.splice(0)) {
    fs.rmSync(folder, { recursive: true, force: true });
  }
});

describe("listJobAssetDirectories", () => {
  it("uses the repository that has the asset folder", () => {
    const repo = `unit-assets-${randomUUID()}`;
    const assetDir = path.join(
      env.GIT_CONFIGS_REPOSITORY,
      repo,
      "timelord-assets",
      "Backup",
    );
    fs.mkdirSync(assetDir, { recursive: true });
    created.push(path.join(env.GIT_CONFIGS_REPOSITORY, repo));

    expect(
      listJobAssetDirectories(
        [
          { enabled: true, name: "missing-repo" },
          { enabled: false, name: repo },
          { enabled: true, name: repo },
        ],
        "Backup",
      ),
    ).toEqual([assetDir]);
  });

  it("returns nothing when the job has no title", () => {
    expect(listJobAssetDirectories([{ enabled: true, name: "crons" }], "")).toEqual(
      [],
    );
  });
});

describe("getJobAssets", () => {
  it("returns 400 when jobId is missing", async () => {
    const reply = createReply();
    await getJobAssets(
      createRequestWithQuery({}),
      asFastifyReply(reply),
    );

    expect(reply.statusCode).toBe(400);
  });

  it("returns 404 when the job does not exist", async () => {
    prisma.job.findFirst.mockResolvedValue(null);

    const reply = createReply();
    await getJobAssets(
      createRequestWithQuery({ jobId: "missing" }),
      asFastifyReply(reply),
    );

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: "No job found" });
  });

  it("returns 404 when no repository has assets for the job", async () => {
    prisma.gitConfig.findMany.mockResolvedValue([
      generateGitConfig({ enabled: true, name: "crons", userId: "user-1" }),
    ]);
    prisma.job.findFirst.mockResolvedValue(
      generateJob({ id: "job-1", title: "Backup" }),
    );

    const reply = createReply();
    await getJobAssets(
      createRequestWithQuery({ jobId: "job-1" }),
      asFastifyReply(reply),
    );

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: "No assets found" });
  });

  it("streams a zip from a later repository when an earlier one has no assets", async () => {
    const repo = `unit-assets-${randomUUID()}`;
    const assetDir = path.join(
      env.GIT_CONFIGS_REPOSITORY,
      repo,
      "timelord-assets",
      "Backup",
    );
    fs.mkdirSync(assetDir, { recursive: true });
    fs.writeFileSync(path.join(assetDir, "note.txt"), "hello from assets");
    created.push(path.join(env.GIT_CONFIGS_REPOSITORY, repo));

    prisma.gitConfig.findMany.mockResolvedValue([
      generateGitConfig({
        enabled: true,
        name: "empty-repo",
        userId: "user-1",
      }),
      generateGitConfig({ enabled: true, name: repo, userId: "user-1" }),
    ]);
    prisma.job.findFirst.mockResolvedValue(
      generateJob({ id: "job-1", title: "Backup" }),
    );

    const raw = new RawResponse();
    await getJobAssets(
      createRequestWithQuery({ jobId: "job-1" }),
      asStreamingReply(raw),
    );

    const body = Buffer.concat(raw.chunks);
    expect(raw.statusCode).toBe(200);
    expect(raw.headers["Content-Type"]).toBe("application/zip");
    expect(body.subarray(0, 2).toString()).toBe("PK");
    expect(body.includes(Buffer.from("note.txt"))).toBe(true);
  });
});

class RawResponse extends Writable {
  statusCode = 0;
  headers: Record<string, string> = {};
  chunks: Buffer[] = [];

  writeHead(statusCode: number, headers: Record<string, string>): this {
    this.statusCode = statusCode;
    this.headers = headers;
    return this;
  }

  override _write(
    chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    this.chunks.push(Buffer.from(chunk));
    callback();
  }
}

function asStreamingReply(raw: RawResponse): FastifyReply {
  return {
    hijack() {},
    raw,
  } as unknown as FastifyReply;
}
