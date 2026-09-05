import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateJob } from "../../../test/entities/job.mts";
import {
  asFastifyReply,
  createReply,
  createRequestWithQuery,
} from "../../../test/utils/fastify-mock.mts";
import { prisma } from "../../__mocks__/prisma-client.mts";
import { getJobCancelStatus } from "./get-job-cancel-status.mts";

vi.mock("../../prisma-client");
vi.mock("../../store.mts", () => ({
  getRobotStore: () => ({
    agentHostname: "agent-host",
    agentName: "agent-host",
    isHuman: false,
    isRobot: true,
    userId: "user-1",
  }),
}));

describe("getJobCancelStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when jobId is missing", async () => {
    const reply = createReply();
    await getJobCancelStatus(createRequestWithQuery({}), asFastifyReply(reply));

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toEqual({ message: "jobId is required" });
  });

  it("should return 404 when the job does not exist for this agent", async () => {
    prisma.job.findFirst.mockResolvedValue(null);

    const reply = createReply();
    await getJobCancelStatus(
      createRequestWithQuery({ jobId: "missing-job" }),
      asFastifyReply(reply),
    );

    expect(prisma.job.findFirst.mock.calls).toEqual([
      [
        {
          where: {
            hostname: "agent-host",
            id: "missing-job",
            userId: "user-1",
          },
          select: {
            cancelRequestedAt: true,
          },
        },
      ],
    ]);
    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ message: "Job not found" });
  });

  it("should return cancelRequested false when no cancellation was requested", async () => {
    prisma.job.findFirst.mockResolvedValue(
      generateJob({ cancelRequestedAt: null }),
    );

    const reply = createReply();
    await getJobCancelStatus(
      createRequestWithQuery({ jobId: "running-job" }),
      asFastifyReply(reply),
    );

    expect(reply.payload).toEqual({ cancelRequested: false });
  });

  it("should return cancelRequested true when cancellation was requested", async () => {
    prisma.job.findFirst.mockResolvedValue(
      generateJob({
        cancelRequestedAt: new Date("2026-08-17T08:00:00.000Z"),
      }),
    );

    const reply = createReply();
    await getJobCancelStatus(
      createRequestWithQuery({ jobId: "running-job" }),
      asFastifyReply(reply),
    );

    expect(reply.payload).toEqual({ cancelRequested: true });
  });
});
