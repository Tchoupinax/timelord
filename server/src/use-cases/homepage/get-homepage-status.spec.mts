import { describe, expect, it, vi } from "vitest";

import { generateJob } from "../../../test/entities/job.mts";
import { prisma } from "../../__mocks__/prisma-client.mts";
import { getHomepageStatus } from "./get-homepage-status.mts";

vi.mock("../../prisma-client");

describe("Get homepage status", () => {
  it("should return a Homepage-friendly status payload", async () => {
    const updatedAt = new Date("2026-04-25T05:00:00.000Z");

    prisma.agent.count.mockResolvedValueOnce(2).mockResolvedValueOnce(3);
    prisma.jobQueue.count.mockResolvedValue(4);
    prisma.job.findFirst.mockResolvedValue(generateJob({
      finalState: "Warning",
      statusCode: 0,
      title: "Backup",
      updatedAt,
    }));

    await expect(getHomepageStatus()).resolves.toEqual({
      agentsOnline: 2,
      agentsOffline: 1,
      queuedJobs: 4,
      lastJobState: "Warning",
      lastJobTitle: "Backup",
      lastJobUpdatedAt: "2026-04-25T05:00:00.000Z",
    });
  });
});
