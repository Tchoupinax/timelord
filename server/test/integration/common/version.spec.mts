import axios from "axios";
import { describe, expect, it } from "vitest";

import { E2E_PORT } from "../../config/e2e-env.mts";

type Version = {
  authenticationDisabled: boolean;
  buildCommitSha: string;
  buildDate: string;
  oidcProviderName: string;
  oidcProviderImage: string;
  vaultEnabled: boolean;
};

describe("GET /version", () => {
  it("should expose build and provider metadata", async () => {
    const { status, data } = await axios<Version>(
      `http://localhost:${E2E_PORT}/version`,
    );

    expect(status).toEqual(200);
    expect(data).toMatchObject({
      authenticationDisabled: false,
      oidcProviderImage: "https://example.com/logo.png",
    });
    expect(typeof data.buildCommitSha).toBe("string");
    expect(typeof data.buildDate).toBe("string");
    expect(typeof data.oidcProviderName).toBe("string");
    expect(typeof data.vaultEnabled).toBe("boolean");
    expect(new Date(data.buildDate).toString()).not.toEqual("Invalid Date");
  });
});
