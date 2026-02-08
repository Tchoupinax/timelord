import { randomUUID } from "node:crypto";

import { FastifyReply, FastifyRequest } from "fastify";

import { logger } from "../../logger.mts";
import { prisma } from "../../prisma-client.mts";
import { env } from "../../tools/env.mts";
import { extractAutheliaData } from "../../tools/extract-authelia-data.mts";
import { getOidcConfiguration } from "./oidc-configuration.mts";

export async function oidcHandleCallback(
  request: FastifyRequest<{
    Querystring: { code: string };
  }>,
  reply: FastifyReply,
) {
  const { code } = request.query;

  const clientId =
    typeof env.OIDC_CLIENT_ID === "string"
      ? env.OIDC_CLIENT_ID
      : env.OIDC_CLIENT_ID.defined
        ? env.OIDC_CLIENT_ID.value
        : null;
  const clientSecret =
    typeof env.OIDC_CLIENT_SECRET === "string"
      ? env.OIDC_CLIENT_SECRET
      : env.OIDC_CLIENT_SECRET.defined
        ? env.OIDC_CLIENT_SECRET.value
        : null;

  if (!clientId || !clientSecret) {
    logger.error("OIDC_CLIENT_ID is required to use Oauth2 connection");
    logger.error("OIDC_CLIENT_SECRET is required to use Oauth2 connection");
    return;
  }

  const formData = new FormData();
  formData.append("client_id", clientId);
  formData.append("client_secret", clientSecret);
  formData.append("grant_type", "authorization_code");
  formData.append("code", code);
  formData.append("redirect_uri", `${env.API_URL}/callback`);

  const { tokenEndpoint } = await getOidcConfiguration();

  const data: unknown = await fetch(tokenEndpoint, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
  }).then(res => res.json());

  const now = new Date();
  now.setDate(now.getDate() + 7); // Add 7 days to the current date
  const expires = now;

  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    data.error
  ) {
    if (
      typeof data === "object" &&
      data !== null &&
      "description" in data &&
      data.description
    ) {
      logger.error(data.description);
    }

    reply.send(data);
    return;
  }

  if (!hasIdToken(data)) {
    throw new Error("missing data");
  }

  const { sub, email, nickname } = extractAutheliaData(data.id_token);
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email,
        id: sub,
        masterTokenForAgent: randomUUID(),
      },
    });
  }

  reply.setCookie("timelord-userId", sub, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires,
  });
  reply.setCookie("timelord-nickname", nickname, {
    httpOnly: false, // Expected to be read from the UI. Not sensitive
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
  });

  reply.redirect(env.UI_URL);
}

function hasIdToken(data: unknown): data is { id_token: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    "id_token" in data &&
    typeof data.id_token === "string" &&
    data.id_token.length > 0
  );
}
