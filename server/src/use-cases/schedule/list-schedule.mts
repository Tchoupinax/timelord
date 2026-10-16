import { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import path from "path";

import { extractMetadata } from "../../functions/extract-metadata.mts";
import { prisma } from "../../prisma-client.mts";
import { getHumanStore } from "../../store.mts";
import { env } from "../../tools/env.mts";
import {
  buildScheduleEntries,
  openPeriodBounds,
  type ScheduleScript,
} from "./build-schedule.mts";

export type UnreadableScript = {
  title: string;
  hostname: string;
  message: string;
};

function scriptTitleFromPath(file: string): string {
  const base = path.basename(file, path.extname(file)).replaceAll("-", " ");
  if (!base) {
    return "Untitled";
  }

  return base.charAt(0).toUpperCase() + base.slice(1);
}

export async function listSchedule(_request: FastifyRequest, reply: FastifyReply) {
  const store = getHumanStore();
  const now = new Date();

  const configs = await prisma.gitConfig.findMany({
    where: { userId: store.userId },
  });

  const folders = configs
    .filter(config => config.enabled)
    .map(config =>
      path.join(
        env.GIT_CONFIGS_REPOSITORY,
        config.name,
        config.folderNameInGitRepository,
      ),
    );

  let subFolders: Array<string> = [];
  for (const folder of folders) {
    if (fs.existsSync(folder)) {
      subFolders = [
        ...subFolders,
        ...fs.readdirSync(folder).map(file => `${folder}/${file}`),
      ];
    }
  }

  let files: Array<string> = [];
  for (const folder of subFolders) {
    if (fs.existsSync(folder) && fs.statSync(folder).isDirectory()) {
      files = [
        ...files,
        ...fs
          .readdirSync(folder)
          .map(file => `${folder}/${file}`)
          .filter(file => fs.statSync(file).isFile()),
      ];
    }
  }

  const scripts: Array<ScheduleScript> = [];
  const unreadable: Array<UnreadableScript> = [];

  for (const file of files) {
    const hostname = file.split("/").at(-2) ?? "";

    try {
      const metadata = extractMetadata(fs.readFileSync(file, "utf-8"));
      if (!metadata.cron) {
        continue;
      }

      scripts.push({
        title: metadata.title,
        hostname,
        cron: metadata.cron,
        timezone: metadata.timezone,
        timezoneInvalid: metadata.timezoneInvalid,
      });
    } catch (error) {
      unreadable.push({
        title: scriptTitleFromPath(file),
        hostname,
        message: error instanceof Error ? error.message : "Could not read this script",
      });
    }
  }

  const periodQueries = scripts.map(script => {
    const period = openPeriodBounds(script, now);

    return {
      title: script.title,
      createdAt: {
        gte: period.start,
        lt: period.end,
      },
    };
  });

  const jobs =
    periodQueries.length === 0
      ? []
      : await prisma.job.findMany({
          where: {
            ...(env.DISABLE_AUTHENTICATION ? {} : { userId: store.userId }),
            OR: periodQueries,
          },
          select: {
            title: true,
            hostname: true,
            createdAt: true,
            statusCode: true,
            finalState: true,
            cancelRequestedAt: true,
          },
        });

  reply.send({
    generatedAt: now.toISOString(),
    entries: buildScheduleEntries(scripts, jobs, now),
    unreadable,
  });
}
