import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateJob } from "../../../test/entities/job.mts";
import {
  asFastifyReply,
  createReply,
  createRequestWithParams,
} from "../../../test/utils/fastify-mock.mts";
import { prisma } from "../../__mocks__/prisma-client.mts";
import { cancelJob } from "./cancel-job.mts";

vi.mock("../../prisma-client");
vi.mock("../../store.mts", () => ({
  getHumanStore: () => ({
    isHuman: true,
    isRobot: false,
    userId: "user-1",
  }),
}));
vi.mock("../../tools/env.mts", () => ({
  env: {
    DISABLE_AUTHENTICATION: false,
  },
}));
vi.mock("../../tools/metrics.mts", () => ({
  jobsCancelRequestedTotal: {
    inc: vi.fn(),
  },
}));

describe("cancelJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 when the job does not exist", async () => {
    prisma.job.findFirst.mockResolvedValue(null);

    const reply = createReply();
    await cancelJob(createRequestWithParams("missing-job"), asFastifyReply(reply));

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ message: "Job not found" });
  });

  it("should return 409 when the job is not running", async () => {
    prisma.job.findFirst.mockResolvedValue(
      generateJob({
        id: "finished-job",
        statusCode: 0,
        userId: "user-1",
      }),
    );

    const reply = createReply();
    await cancelJob(createRequestWithParams("finished-job"), asFastifyReply(reply));

    expect(reply.statusCode).toBe(409);
    expect(reply.payload).toEqual({ message: "Job is not running" });
  });

  it("should request cancellation for a running job", async () => {
    const job = generateJob({
      id: "running-job",
      statusCode: -1,
      userId: "user-1",
    });
    prisma.job.findFirst.mockResolvedValue(job);
    prisma.job.update.mockResolvedValue(job);

    const reply = createReply();
    await cancelJob(createRequestWithParams("running-job"), asFastifyReply(reply));

    expect(prisma.job.update.mock.calls).toHaveLength(1);
    const updateArgs = prisma.job.update.mock.calls[0]?.[0];
    expect(updateArgs?.where).toEqual({ id: "running-job" });
    expect(updateArgs?.data.cancelRequestedAt).toBeInstanceOf(Date);
    expect(reply.statusCode).toBe(200);
    expect(reply.payload).toEqual({ message: "Job cancellation requested" });
  });

  it("should not update the job when cancellation was already requested", async () => {
    prisma.job.findFirst.mockResolvedValue(
      generateJob({
        cancelRequestedAt: new Date("2026-08-17T08:00:00.000Z"),
        id: "running-job",
        statusCode: -1,
        userId: "user-1",
      }),
    );

    const reply = createReply();
    await cancelJob(createRequestWithParams("running-job"), asFastifyReply(reply));

    expect(prisma.job.update.mock.calls).toHaveLength(0);
    expect(reply.payload).toEqual({ message: "Job cancellation already requested" });
  });
});
