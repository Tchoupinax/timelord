import { describe, expect, it, vi } from "vitest";

import { prisma } from "../../__mocks__/prisma-client.mts";
import { syncAgentRuntime } from "./sync-agent-runtime.mts";

vi.mock("../../prisma-client");
vi.mock("../../logger.mts", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock("../jobs/reconcile-stale-running-jobs.mts", () => ({
  orphanAllRunningJobsForHost: vi.fn(),
  reconcileRunningJobsForAgent: vi.fn(),
}));

import {
  orphanAllRunningJobsForHost,
  reconcileRunningJobsForAgent,
} from "../jobs/reconcile-stale-running-jobs.mts";

describe("syncAgentRuntime", () => {
  it("orphans host jobs when the runtime instance id changes", async () => {
    prisma.agent.findUnique.mockResolvedValue({
      runtimeInstanceId: "old-instance",
    });

    await syncAgentRuntime({
      userId: "user-1",
      agentName: "machine-a",
      hostname: "machine-a",
      instanceId: "new-instance",
      reportsInstanceId: true,
      reportsActiveJobId: false,
    });

    expect(orphanAllRunningJobsForHost).toHaveBeenCalledWith(
      "user-1",
      "machine-a",
    );
    expect(reconcileRunningJobsForAgent).not.toHaveBeenCalled();
  });

  it("does not orphan on first instance id seen", async () => {
    prisma.agent.findUnique.mockResolvedValue({ runtimeInstanceId: null });

    await syncAgentRuntime({
      userId: "user-1",
      agentName: "machine-a",
      hostname: "machine-a",
      instanceId: "new-instance",
      reportsInstanceId: true,
      reportsActiveJobId: false,
    });

    expect(orphanAllRunningJobsForHost).not.toHaveBeenCalled();
  });
});
