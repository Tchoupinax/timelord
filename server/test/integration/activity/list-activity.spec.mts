import { randomUUID } from "node:crypto";

import axios from "axios";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../../../src/prisma-client.mts";
import { TEST_USER_ID } from "../../config/constants.mts";
import { E2E_PORT } from "../../config/e2e-env.mts";
import { generateJob } from "../../entities/job.mts";

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  jobId?: string;
};

describe("when listing activity", () => {
  const succeededJob = generateJob({
    id: randomUUID(),
    userId: TEST_USER_ID,
    title: "Succeeded job",
    statusCode: 0,
    finalState: "Success",
  });
  const failedJob = generateJob({
    id: randomUUID(),
    userId: TEST_USER_ID,
    title: "Failed job",
    statusCode: 1,
    statusComment: "Boom",
  });

  let activities: ActivityItem[];

  beforeAll(async () => {
    await prisma.job.deleteMany();
    await prisma.jobQueue.deleteMany();
    await prisma.job.createMany({ data: [succeededJob, failedJob] });

    ({
      data: { activities },
    } = await axios<{ activities: ActivityItem[] }>({
      url: `http://localhost:${E2E_PORT}/activity`,
      headers: { "Content-Type": "application/json" },
    }));
  });

  afterAll(async () => {
    await prisma.job.deleteMany();
    await prisma.jobQueue.deleteMany();
  });

  it("should emit a started and a succeeded entry for a successful job", () => {
    const ownEntries = activities.filter(
      activity => activity.jobId === succeededJob.id,
    );
    const types = ownEntries.map(entry => entry.type);
    expect(types).toContain("job_started");
    expect(types).toContain("job_succeeded");
  });

  it("should emit a failed entry for a failing job", () => {
    const failedEntry = activities.find(
      activity =>
        activity.jobId === failedJob.id && activity.type === "job_failed",
    );
    expect(failedEntry).toBeDefined();
    expect(failedEntry?.title).toEqual("Failed job");
  });
});
