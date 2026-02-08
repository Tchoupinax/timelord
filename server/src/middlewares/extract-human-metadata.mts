import { requestContext } from "@fastify/request-context";

import type { FastifyReply, FastifyRequest } from "fastify";

import { logger } from "../logger.mts";
import { env } from "../tools/env.mts";

// ⚠️ DO NOT REMOVE async, fastify uses signature to adapt its behavior
// eslint-disable-next-line @typescript-eslint/require-await
export async function extractHumanMetadata(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  logger.debug(`extractHumanMetadata - ${request.method} ${request.url}`);

  if (
    !env.DISABLE_AUTHENTICATION &&
    !request.cookies["timelord-userId"] &&
    process.env.NODE_ENV !== "test"
  ) {
    reply.status(401).send("Not authorized");
    return;
  }

  if (process.env.NODE_ENV === "test") {
    request.cookies["timelord-userId"] = "64acaf9d-3d69-422f-8141-0641123990f2";
  }

  requestContext.set("store", {
    userId: request.cookies["timelord-userId"] ?? "",
    isRobot: false,
    isHuman: true,
  });
}
