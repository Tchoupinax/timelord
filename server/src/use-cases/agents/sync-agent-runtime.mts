import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import {
  orphanAllRunningJobsForHost,
  reconcileRunningJobsForAgent,
} from "../jobs/reconcile-stale-running-jobs.mts";

export type AgentRuntimeContext = {
  userId: string;
  agentName: string;
  hostname: string;
  instanceId?: string;
  reportsInstanceId: boolean;
  activeJobId?: string;
  reportsActiveJobId: boolean;
};

/**
 * Tracks the agent process fingerprint (renewed on every pod/process start).
 * When it changes, running jobs on that host are orphaned before new work.
 */
export async function syncAgentRuntime(
  context: AgentRuntimeContext,
): Promise<void> {
  const instanceId = context.instanceId?.trim();

  if (context.reportsInstanceId && instanceId) {
    const agent = await prisma.agent.findUnique({
      where: { name: context.agentName },
      select: { runtimeInstanceId: true },
    });

    const previous = agent?.runtimeInstanceId;
    if (previous && previous !== instanceId) {
      logger.warn(
        {
          agentName: context.agentName,
          hostname: context.hostname,
          previousInstanceId: previous,
          instanceId,
        },
        "Agent runtime instance changed — orphaning running jobs on host",
      );
      await orphanAllRunningJobsForHost(context.userId, context.hostname);
    }
  }

  if (context.reportsActiveJobId) {
    await reconcileRunningJobsForAgent({
      userId: context.userId,
      hostname: context.hostname,
      activeJobId: context.activeJobId ?? null,
    });
  }
}

export async function persistAgentRuntime(
  context: AgentRuntimeContext,
  version: string,
): Promise<void> {
  const instanceId = context.reportsInstanceId
    ? context.instanceId?.trim() || null
    : undefined;

  await prisma.agent.upsert({
    where: { name: context.agentName },
    create: {
      token: "",
      userId: context.userId,
      name: context.agentName,
      seenAt: new Date(),
      version,
      ...(instanceId !== undefined ? { runtimeInstanceId: instanceId } : {}),
    },
    update: {
      seenAt: new Date(),
      version,
      ...(instanceId !== undefined ? { runtimeInstanceId: instanceId } : {}),
    },
  });
}
