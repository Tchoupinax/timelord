import { describe, expect, it, vi } from "vitest";

import { prisma } from "../../__mocks__/prisma-client.mts";
import { reclaimLeasedQueueJobs } from "./reclaim-leased-jobs.mts";

vi.mock("../../prisma-client");
vi.mock("../../logger.mts", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock("../../tools/metrics.mts", () => ({
  jobQueueRedeliveredTotal: { inc: vi.fn() },
  jobQueueExhaustedTotal: { inc: vi.fn() },
}));

function leasedEntry(overrides: Record<string, unknown> = {}) {
  return {
    title: "Backup",
    userId: "user-1",
    hostname: "machine-a",
    leasedAt: new Date(),
    leasedJobId: "job-1",
    attempts: 1,
    maxAttempts: 1,
    ...overrides,
  };
}

describe("reclaimLeasedQueueJobs", () => {
  it("leaves the lease in place while the job is still running", async () => {
    prisma.jobQueue.findMany.mockResolvedValue([leasedEntry()] as never);
    prisma.job.findUnique.mockResolvedValue({ statusCode: -1 } as never);

    await reclaimLeasedQueueJobs();

    expect(prisma.jobQueue.update.mock.calls).toHaveLength(0);
    expect(prisma.jobQueue.delete.mock.calls).toHaveLength(0);
  });

  it("redelivers a failed job while attempts remain", async () => {
    prisma.jobQueue.findMany.mockResolvedValue([
      leasedEntry({ attempts: 1, maxAttempts: 3 }),
    ] as never);
    prisma.job.findUnique.mockResolvedValue({ statusCode: 1 } as never);

    await reclaimLeasedQueueJobs();

    expect(prisma.jobQueue.update.mock.calls).toHaveLength(1);
    expect(prisma.jobQueue.update.mock.calls[0]?.[0]?.data?.leasedAt).toBeNull();
    expect(prisma.jobQueue.delete.mock.calls).toHaveLength(0);
  });

  it("drops a failed job once attempts are exhausted", async () => {
    prisma.jobQueue.findMany.mockResolvedValue([
      leasedEntry({ attempts: 1, maxAttempts: 1 }),
    ] as never);
    prisma.job.findUnique.mockResolvedValue({ statusCode: 1 } as never);

    await reclaimLeasedQueueJobs();

    expect(prisma.jobQueue.delete.mock.calls).toHaveLength(1);
    expect(prisma.jobQueue.update.mock.calls).toHaveLength(0);
  });

  it("drops a succeeded entry without redelivering", async () => {
    prisma.jobQueue.findMany.mockResolvedValue([
      leasedEntry({ attempts: 1, maxAttempts: 3 }),
    ] as never);
    prisma.job.findUnique.mockResolvedValue({ statusCode: 0 } as never);

    await reclaimLeasedQueueJobs();

    expect(prisma.jobQueue.delete.mock.calls).toHaveLength(1);
    expect(prisma.jobQueue.update.mock.calls).toHaveLength(0);
  });

  it("redelivers when the job record is gone and attempts remain", async () => {
    prisma.jobQueue.findMany.mockResolvedValue([
      leasedEntry({ attempts: 1, maxAttempts: 2 }),
    ] as never);
    prisma.job.findUnique.mockResolvedValue(null);

    await reclaimLeasedQueueJobs();

    expect(prisma.jobQueue.update.mock.calls).toHaveLength(1);
  });
});
