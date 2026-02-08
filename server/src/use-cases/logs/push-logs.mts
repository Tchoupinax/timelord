import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import { getRobotStore } from "../../store.mts";
import { hideSecret } from "../jobs/get-job/inject-secret.mts";

const pushLogsPayload = z.object({
  content: z.string(),
  createdAt: z.string(),
  index: z.number().min(0),
  jobId: z.uuid(),
  type: z.string(),
});

export async function pushLogs(
  request: FastifyRequest<{
    Body: z.infer<typeof pushLogsPayload>;
  }>,
  reply: FastifyReply,
) {
  const store = getRobotStore();
  const { success, data, error } = pushLogsPayload.safeParse(request.body);
  if (!success) {
    logger.error(error);
    reply.status(422).send(error);
    return;
  }

  const { content, createdAt, jobId, index, type } = data;

  await prisma.log.create({
    data: {
      content: await hideSecret(content),
      createdAt,
      jobId,
      index,
      type,
      userId: store.userId,
    },
  });

  return {};
}
