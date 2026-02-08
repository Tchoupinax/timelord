import { randomUUID } from "crypto";
import { FastifyReply, FastifyRequest } from "fastify";

import { logger } from "../../logger.mts";
import { computeAuthorizationUrl } from "../../tools/compute-authorization-url.mts";
import { env } from "../../tools/env.mts";

export async function oidcAuthorization(
  _: FastifyRequest,
  reply: FastifyReply,
) {
  const clientId =
    typeof env.OIDC_CLIENT_ID === "string"
      ? env.OIDC_CLIENT_ID
      : env.OIDC_CLIENT_ID.defined
        ? env.OIDC_CLIENT_ID.value
        : null;

  if (!clientId) {
    logger.error("OIDC_CLIENT_ID is required to use Oauth2 connection");
    return;
  }

  const authUrl = await computeAuthorizationUrl({
    clientId,
    redirectUri: `${env.API_URL}/callback`,
    scope: ["profile", "groups", "email"],
    state: randomUUID(),
  });

  reply.redirect(authUrl);
}
