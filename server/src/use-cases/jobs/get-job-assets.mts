import archiver from "archiver";
import type { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import path from "path";

import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import { getRobotStore } from "../../store.mts";
import { env } from "../../tools/env.mts";

export async function getJobAssets(
  request: FastifyRequest<{ Querystring: { jobId: string } }>,
  reply: FastifyReply,
) {
  const store = getRobotStore();
  const { jobId } = request.query;

  if (!jobId) {
    logger.error("No message id found in query params");
    reply.send({
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
    reply.send({
      error: "No job found",
    });
    return;
  }

  const folders = configs
    // Only use repositories enabled
    .filter(c => c.enabled)
    .map(c =>
      path.join(
        env.GIT_CONFIGS_REPOSITORY,
        c.name,
        "timelord-assets",
        job.title!,
      ),
    );

  for (const folder of folders) {
    if (fs.existsSync(folder)) {
      const zipFileName = "asset.zip";

      reply.header(
        "Content-Disposition",
        `attachment; filename=${zipFileName}`,
      );
      reply.header("Content-Type", "application/zip");

      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(reply.raw);
      archive.directory(folder, false);
      await archive.finalize();
    } else {
      reply.send({ msg: "No assets found" });
      return;
    }
  }
}
