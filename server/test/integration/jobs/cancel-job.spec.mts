import { randomUUID } from "node:crypto";

import axios, { type AxiosError } from "axios";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../../../src/prisma-client.mts";
import { TEST_USER_ID } from "../../config/constants.mts";
import { generateJob } from "../../entities/job.mts";

const masterTokenForAgent = randomUUID();
const agentHostname = "Integration-Tests";

const agentHeaders = {
  "Content-Type": "application/json",
  "X-Timelord-Agent-Token": masterTokenForAgent,
  "X-Timelord-Hostname": agentHostname,
};

describe("when cancelling a job", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany();
    await prisma.job.deleteMany();
    await prisma.user.create({
      data: {
        email: "user@timelord.org",
        id: TEST_USER_ID,
        masterTokenForAgent,
      },
    });
  });

  afterAll(async () => {
    await prisma.job.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should return cancelRequested false before a cancellation is requested", async () => {
    const jobId = randomUUID();
    await prisma.job.create({
      data: generateJob({
        hostname: agentHostname,
        id: jobId,
        statusCode: -1,
        title: "Running job",
        userId: TEST_USER_ID,
      }),
    });

    const { data } = await axios.get<{ cancelRequested: boolean }>(
      `http://localhost:18888/job/cancel?jobId=${jobId}`,
      { headers: agentHeaders },
    );

    expect(data).toEqual({ cancelRequested: false });
  });

  it("should request cancellation for a running job", async () => {
    const jobId = randomUUID();
    await prisma.job.create({
      data: generateJob({
        hostname: agentHostname,
        id: jobId,
        statusCode: -1,
        title: "Running job",
        userId: TEST_USER_ID,
      }),
    });

    const { data, status } = await axios.post<{ message: string }>(
      `http://localhost:18888/jobs/${jobId}/cancel`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    expect(status).toBe(200);
    expect(data).toEqual({ message: "Job cancellation requested" });

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });
    expect(job?.cancelRequestedAt).not.toBeNull();
  });

  it("should return cancelRequested true after a cancellation is requested", async () => {
    const jobId = randomUUID();
    await prisma.job.create({
      data: generateJob({
        cancelRequestedAt: new Date("2026-08-17T08:00:00.000Z"),
        hostname: agentHostname,
        id: jobId,
        statusCode: -1,
        title: "Stopping job",
        userId: TEST_USER_ID,
      }),
    });

    const { data } = await axios.get<{ cancelRequested: boolean }>(
      `http://localhost:18888/job/cancel?jobId=${jobId}`,
      { headers: agentHeaders },
    );

    expect(data).toEqual({ cancelRequested: true });
  });

  it("should not request cancellation twice", async () => {
    const jobId = randomUUID();
    const cancelRequestedAt = new Date("2026-08-17T08:00:00.000Z");
    await prisma.job.create({
      data: generateJob({
        cancelRequestedAt,
        hostname: agentHostname,
        id: jobId,
        statusCode: -1,
        title: "Already stopping job",
        userId: TEST_USER_ID,
      }),
    });

    const { data } = await axios.post<{ message: string }>(
      `http://localhost:18888/jobs/${jobId}/cancel`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    expect(data).toEqual({ message: "Job cancellation already requested" });
    expect(job?.cancelRequestedAt?.toISOString()).toEqual(
      cancelRequestedAt.toISOString(),
    );
  });

  it("should reject cancellation for a job that is not running", async () => {
    const jobId = randomUUID();
    await prisma.job.create({
      data: generateJob({
        hostname: agentHostname,
        id: jobId,
        statusCode: 0,
        title: "Finished job",
        userId: TEST_USER_ID,
      }),
    });

    try {
      await axios.post(
        `http://localhost:18888/jobs/${jobId}/cancel`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      expect.fail("Expected request to fail");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      expect(axiosError.response?.status).toBe(409);
      expect(axiosError.response?.data).toEqual({
        message: "Job is not running",
      });
    }
  });

  it("should return 404 when the job does not belong to the current user", async () => {
    const jobId = randomUUID();
    await prisma.job.create({
      data: generateJob({
        hostname: agentHostname,
        id: jobId,
        statusCode: -1,
        title: "Other user job",
        userId: randomUUID(),
      }),
    });

    try {
      await axios.post(
        `http://localhost:18888/jobs/${jobId}/cancel`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      expect.fail("Expected request to fail");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      expect(axiosError.response?.status).toBe(404);
      expect(axiosError.response?.data).toEqual({
        message: "Job not found",
      });
    }
  });

  it("should return 404 when the agent hostname does not match", async () => {
    const jobId = randomUUID();
    await prisma.job.create({
      data: generateJob({
        hostname: agentHostname,
        id: jobId,
        statusCode: -1,
        title: "Running job",
        userId: TEST_USER_ID,
      }),
    });

    try {
      await axios.get(`http://localhost:18888/job/cancel?jobId=${jobId}`, {
        headers: {
          ...agentHeaders,
          "X-Timelord-Hostname": "another-host",
        },
      });
      expect.fail("Expected request to fail");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      expect(axiosError.response?.status).toBe(404);
      expect(axiosError.response?.data).toEqual({
        message: "Job not found",
      });
    }
  });
});
