import { randomUUID } from "node:crypto";

import { FastifyReply, FastifyRequest } from "fastify";

import { logger } from "../../logger.mts";
import { computeAuthorizationUrl } from "../../tools/compute-authorization-url.mts";
import {
  cookieSecureForUrl,
  parseOAuthReturnTo,
  resolveOAuthRedirectUri,
} from "../../tools/parse-oauth-return-to.mts";
import { env } from "../../tools/env.mts";

const oauthCookieMaxAgeSeconds = 60 * 10;

export async function oidcAuthorization(
  request: FastifyRequest<{
    Querystring: {
      return_to?: string;
    };
  }>,
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

  const returnTo = parseOAuthReturnTo(request.query.return_to, env.UI_URL);
  const redirectUri = resolveOAuthRedirectUri(returnTo, env.API_URL);
  const postAuthRedirect = returnTo?.origin ?? env.UI_URL;

  if (returnTo) {
    const secure = cookieSecureForUrl(returnTo.origin);
    const cookieOptions = {
      httpOnly: true,
      path: "/",
      maxAge: oauthCookieMaxAgeSeconds,
      sameSite: "lax" as const,
      secure,
    };

    reply.setCookie("timelord-oauth-redirect-uri", redirectUri, cookieOptions);
    reply.setCookie("timelord-oauth-return-to", postAuthRedirect, cookieOptions);
  }

  const authUrl = await computeAuthorizationUrl({
    clientId,
    redirectUri,
    scope: ["profile", "groups", "email"],
    state: randomUUID(),
  });

  reply.redirect(authUrl);
}
