import { FastifyReply, FastifyRequest } from "fastify";

import { env } from "../../tools/env.mts";

export function logout(_: FastifyRequest, reply: FastifyReply) {
  reply.clearCookie("timelord-userId");
  reply.clearCookie("timelord-nickname");
  reply.redirect(env.UI_URL);
}
