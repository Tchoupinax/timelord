import { randomUUID } from "node:crypto";

import { type Job } from "#prisma";

export function generateJob(override: Partial<Job> = {}): Job {
  return {
    createdAt: new Date(),
    cron: "cron",
    hostname: "hotname",
    id: randomUUID(),
    statusCode: null,
    title: "title",
    updatedAt: new Date(),
    userId: randomUUID(),
    statusComment: null,
    nextPlannedExecution: "",
    finalState: null,
    ...override,
  };
}
