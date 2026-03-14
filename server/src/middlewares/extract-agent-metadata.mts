import { requestContext } from "@fastify/request-context";
import { trace } from "@opentelemetry/api";

import { type FastifyReply, type FastifyRequest } from "fastify";

import { logger } from "../logger.mts";
import { prisma } from "../prisma-client.mts";

const ATTR_AGENT_NAME = "timelord.agent.name";
const ATTR_AGENT_HOSTNAME = "timelord.agent.hostname";

export async function extractAgentMetadata(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.headers["x-timelord-agent-token"]) {
    requestContext.set("store", {
      isRobot: false,
      isHuman: false,
    });
    return;
  }

  let agentUserId: string;
  let agentName: string | undefined = undefined;

  const agentHostname = request.headers["x-timelord-hostname"] as string;
  const agentToken = request.headers["x-timelord-agent-token"] as string;

  logger.debug("Agent identified as %s, %s", agentHostname, agentToken);

  if (agentToken) {
    const agent = await prisma.agent.findFirst({
      where: { token: agentToken },
    });

    // If there is not agent found by the token, we are looking if an user
    // has this token as master token for agents
    if (!agent) {
      const user = await prisma.user.findFirst({
        where: {
          masterTokenForAgent: agentToken,
        },
      });

      if (user) {
        requestContext.set("store", {
          agentName: agentHostname,
          agentHostname: request.headers["x-timelord-hostname"] as string,
          userId: user?.id,
          isRobot: true,
          isHuman: false,
        });
        setAgentSpanAttributes(agentHostname, agentHostname);
      } else {
        requestContext.set("store", {
          isRobot: false,
          isHuman: false,
        });

        reply.status(403);
        return;
      }
    } else {
      agentUserId = agent.userId;
      agentName = agent.name;

      requestContext.set("store", {
        agentName: agentName ?? "",
        agentHostname: request.headers["x-timelord-hostname"] as string,
        userId: agentUserId,
        isRobot: true,
        isHuman: false,
      });
      setAgentSpanAttributes(agentName ?? "", agentHostname);
    }
  }
}

function setAgentSpanAttributes(agentName: string, agentHostname: string) {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute(ATTR_AGENT_NAME, agentName);
    span.setAttribute(ATTR_AGENT_HOSTNAME, agentHostname);
  }
}
