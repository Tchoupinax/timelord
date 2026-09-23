import { afterEach, describe, expect, it, vi } from "vitest";

import { getOidcConfiguration } from "./oidc-configuration.mts";

describe("OIDC configuration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses the discovery document", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          authorization_endpoint: "https://sso.example/authorize",
          token_endpoint: "https://sso.example/token",
        }),
      }),
    );

    expect(await getOidcConfiguration()).toEqual({
      authorizationEndpoint: "https://sso.example/authorize",
      tokenEndpoint: "https://sso.example/token",
    });
  });
});
