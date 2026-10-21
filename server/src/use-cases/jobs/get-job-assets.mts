import { finished } from "node:stream/promises";

import { ZipArchive } from "archiver";
import type { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import path from "path";

import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import { getRobotStore } from "../../store.mts";
import { env } from "../../tools/env.mts";

type AssetConfig = {
  enabled: boolean;
  name: string;
};

// Directories named timelord-assets/<job title> inside enabled git configs.
// A missing folder is skipped so another repository can still provide the files.
export function listJobAssetDirectories(
  configs: ReadonlyArray<AssetConfig>,
  jobTitle: string | null | undefined,
): string[] {
  if (!jobTitle) {
    return [];
  }

  const directories: string[] = [];
  for (const config of configs) {
    if (!config.enabled) {
      continue;
    }

    const folder = path.join(
      env.GIT_CONFIGS_REPOSITORY,
      config.name,
      "timelord-assets",
      jobTitle,
    );

    try {
      if (!fs.statSync(folder).isDirectory()) {
        continue;
      }
    } catch {
      continue;
    }

    directories.push(folder);
  }

  return directories;
}

export async function getJobAssets(
  request: FastifyRequest<{ Querystring: { jobId: string } }>,
  reply: FastifyReply,
) {
  const store = getRobotStore();
  const { jobId } = request.query;

  if (!jobId) {
    logger.error("No message id found in query params");
    reply.status(400).send({
      error: "No message id found in query params",
    });
    return;
  }

  const configs = await prisma.gitConfig.findMany({
    where: { userId: store.userId },
  });

  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    logger.error("No job found");
    reply.status(404).send({
      error: "No job found",
    });
    return;
  }

  const directories = listJobAssetDirectories(configs, job.title);
  if (directories.length === 0) {
    reply.status(404).send({ error: "No assets found" });
    return;
  }

  await streamAssetZip(reply, directories);
}

// reply.raw is used so the zip is not buffered. Without hijack, Fastify writes
// its own response when the handler returns and the agent receives a file that
// is not a valid zip.
async function streamAssetZip(
  reply: FastifyReply,
  directories: string[],
): Promise<void> {
  reply.hijack();
  reply.raw.writeHead(200, {
    "Content-Disposition": "attachment; filename=asset.zip",
    "Content-Type": "application/zip",
  });

  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.pipe(reply.raw);
  for (const folder of directories) {
    archive.directory(folder, false);
  }

  try {
    await archive.finalize();
    await finished(reply.raw);
  } catch (err) {
    logger.error({ err }, "Failed to stream job assets");
    reply.raw.destroy();
  }
}
