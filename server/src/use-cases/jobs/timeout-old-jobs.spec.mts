import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";

import { generateJob } from "../../../test/entities/job.mts";
import { prisma } from "../../__mocks__/prisma-client.mts";
import { timeoutOldJobs } from "./timeout-old-jobs.mts";

vi.mock("../../prisma-client");

describe("Timeout old jobs", () => {
  it("should finish and timeout job that is longer than 1h", async () => {
    prisma.job.findMany.mockResolvedValue([
      generateJob({
        createdAt: dayjs().toDate(),
        statusComment: null,
      }),
      generateJob({
        createdAt: dayjs().subtract(2, "day").toDate(),
        statusComment: null,
      }),
    ]);

    expect(await timeoutOldJobs()).toBe(undefined);
  });
});
