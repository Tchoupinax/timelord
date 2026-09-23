import type { FastifyReply, FastifyRequest } from "fastify";

import { getRobotStore } from "../../store.mts";
import {
  persistAgentRuntime,
  syncAgentRuntime,
} from "./sync-agent-runtime.mts";

export async function agentHeartbeat(
  request: FastifyRequest<{
    Body: { version: string; activeJobId?: string | null };
  }>,
  reply: FastifyReply,
) {
  const store = getRobotStore();

  if (!store.agentHostname || !store.userId) {
    reply.status(200);
    return;
  }

  await syncAgentRuntime({
    userId: store.userId,
    agentName: store.agentName,
    hostname: store.agentHostname,
    instanceId: store.instanceId,
    reportsInstanceId: store.reportsInstanceId,
    activeJobId: store.activeJobId,
    reportsActiveJobId: store.reportsActiveJobId,
  });

  await persistAgentRuntime(
    {
      userId: store.userId,
      agentName: store.agentName,
      hostname: store.agentHostname,
      instanceId: store.instanceId,
      reportsInstanceId: store.reportsInstanceId,
      activeJobId: store.activeJobId,
      reportsActiveJobId: store.reportsActiveJobId,
    },
    request.body?.version ?? "",
  );

  return "OK";
}
