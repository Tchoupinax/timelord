import type { FastifyReply, FastifyRequest } from "fastify";

export type TestReply = {
  payload: unknown;
  statusCode: number;
  send: (payload: unknown) => TestReply;
  status: (code: number) => TestReply;
};

export function createReply(): TestReply {
  const reply: TestReply = {
    payload: undefined,
    statusCode: 200,
    send(payload: unknown) {
      reply.payload = payload;
      return reply;
    },
    status(code: number) {
      reply.statusCode = code;
      return reply;
    },
  };

  return reply;
}

export function asFastifyReply(reply: TestReply): FastifyReply {
  return reply as unknown as FastifyReply;
}

export function createRequestWithParams(
  id: string,
): FastifyRequest<{ Params: { id: string } }> {
  return {
    params: { id },
  } as unknown as FastifyRequest<{ Params: { id: string } }>;
}

export function createRequestWithQuery(query: {
  jobId?: string;
}): FastifyRequest<{ Querystring: { jobId: string } }> {
  return {
    query,
  } as unknown as FastifyRequest<{ Querystring: { jobId: string } }>;
}
