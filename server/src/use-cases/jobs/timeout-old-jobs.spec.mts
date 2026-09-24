import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";

import { generateJob } from "../../../test/entities/job.mts";
import { prisma } from "../../__mocks__/prisma-client.mts";
import { timeoutOldJobs } from "./timeout-old-jobs.mts";

vi.mock("../../prisma-client");
vi.mock("../../logger.mts", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
  },
}));
vi.mock("../../tools/env.mts", () => ({
  env: {
    JOB_DEFAULT_TIMEOUT: "1h",
  },
}));

describe("Timeout old jobs", () => {
  it("should timeout only jobs older than the configured timeout", async () => {
    prisma.job.findMany.mockResolvedValue([
      generateJob({
        createdAt: dayjs().subtract(30, "minute").toDate(),
        statusComment: null,
        statusCode: -1,
      }),
      generateJob({
        createdAt: dayjs().subtract(2, "hour").toDate(),
        statusComment: null,
        statusCode: -1,
      }),
    ]);

    await timeoutOldJobs();

    expect(prisma.job.update.mock.calls).toHaveLength(1);
  });

  it("should respect per-job jobTimeoutMinutes over the global default", async () => {
    prisma.job.findMany.mockResolvedValue([
      generateJob({
        createdAt: dayjs().subtract(90, "minute").toDate(),
        statusCode: -1,
        jobTimeoutMinutes: 12 * 60,
      }),
      generateJob({
        createdAt: dayjs().subtract(90, "minute").toDate(),
        statusCode: -1,
        jobTimeoutMinutes: null,
      }),
    ]);

    await timeoutOldJobs();

    expect(prisma.job.update.mock.calls).toHaveLength(1);
  });
});
