import { getOidcConfiguration } from "../use-cases/oidc/oidc-configuration.mts";

type Payload = {
  clientId: string;
  redirectUri: string;
  state: string;
  scope: Array<string>;
};

export async function computeAuthorizationUrl(
  payload: Payload,
): Promise<string> {
  const { authorizationEndpoint } = await getOidcConfiguration();

  const queryString = new URLSearchParams();

  queryString.set("client_id", payload.clientId);
  queryString.set("redirect_uri", payload.redirectUri);
  queryString.set("response_type", "code");
  queryString.set("state", payload.state);
  queryString.set("scope", ["openid", ...payload.scope].join(" "));

  return `${authorizationEndpoint}?${queryString.toString()}`;
}
