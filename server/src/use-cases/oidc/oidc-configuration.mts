export async function getOidcConfiguration(): Promise<{
  authorizationEndpoint: string;
  tokenEndpoint: string;
}> {
  const data: unknown = await fetch(
    "https://sso.corentinfiloche.xyz/.well-known/openid-configuration",
  ).then(res => res.json());

  if (!isOidcDiscovery(data)) {
    throw new Error("Invalid OIDC configuration response");
  }

  return {
    authorizationEndpoint: data.authorization_endpoint,
    tokenEndpoint: data.token_endpoint,
  };
}

type OidcDiscovery = {
  authorization_endpoint: string;
  token_endpoint: string;
};

function isOidcDiscovery(data: unknown): data is OidcDiscovery {
  return (
    typeof data === "object" &&
    data !== null &&
    "authorization_endpoint" in data &&
    "token_endpoint" in data &&
    typeof data.authorization_endpoint === "string" &&
    typeof data.token_endpoint === "string"
  );
}
