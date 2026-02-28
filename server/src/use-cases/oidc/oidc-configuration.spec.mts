/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, expect, it } from "vitest";

import { getOidcConfiguration } from "./oidc-configuration.mts";

describe("OIDC configuration", () => {
  it("zfe", async () => {
    expect(await getOidcConfiguration()).toEqual({
      authorizationEndpoint: expect.any(String),
      tokenEndpoint: expect.any(String),
    });
  });
});
