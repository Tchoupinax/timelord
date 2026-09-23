import type { Job } from "#prisma";

import { describe, expect, it, vi } from "vitest";

import { generateJob } from "../../../test/entities/job.mts";
import { prisma } from "../../__mocks__/prisma-client.mts";
import {
  ORPHANED_JOB_STATUS_COMMENT,
  reconcileRunningJobsForAgent,
} from "./reconcile-stale-running-jobs.mts";

vi.mock("../../prisma-client");
vi.mock("../../logger.mts", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
vi.mock("../../tools/metrics.mts", () => ({
  jobsOrphanedTotal: { inc: vi.fn() },
}));

describe("reconcileRunningJobsForAgent", () => {
  it("orphans running jobs when the agent reports no active job", async () => {
    prisma.job.findMany.mockResolvedValue([
      { id: "job-1", title: "Backup" },
      { id: "job-2", title: "Other" },
    ] as Job[]);
    prisma.job.update.mockResolvedValue(generateJob({ id: "job-1" }));

    await reconcileRunningJobsForAgent({
      userId: "user-1",
      hostname: "machine-a",
      activeJobId: null,
    });

    expect(prisma.job.update).toHaveBeenCalledTimes(2);
    expect(prisma.job.update.mock.calls[0]?.[0]?.data?.statusComment).toBe(
      ORPHANED_JOB_STATUS_COMMENT,
    );
  });

  it("keeps the job that matches activeJobId", async () => {
    prisma.job.findMany.mockResolvedValue([
      { id: "job-1", title: "Backup" },
      { id: "job-2", title: "Other" },
    ] as Job[]);
    prisma.job.update.mockResolvedValue(generateJob({ id: "job-1" }));

    await reconcileRunningJobsForAgent({
      userId: "user-1",
      hostname: "machine-a",
      activeJobId: "job-1",
    });

    expect(prisma.job.update).toHaveBeenCalledTimes(1);
    expect(prisma.job.update.mock.calls[0]?.[0]?.where?.id).toBe("job-2");
  });
});
