import { describe, expect, it } from "vitest";

import {
  cookieSecureForUrl,
  isLocalOAuthReturnTo,
  localOAuthRedirectUri,
  parseOAuthReturnTo,
  resolveOAuthRedirectUri,
} from "./parse-oauth-return-to.mts";

describe("parseOAuthReturnTo", () => {
  const uiUrl = "https://crons.mysupercloud.dev";

  it("allows localhost origins", () => {
    expect(parseOAuthReturnTo("http://localhost:3000", uiUrl)?.origin).toBe(
      "http://localhost:3000",
    );
    expect(parseOAuthReturnTo("http://127.0.0.1:3000", uiUrl)?.origin).toBe(
      "http://127.0.0.1:3000",
    );
  });

  it("allows the configured UI origin", () => {
    expect(parseOAuthReturnTo("https://crons.mysupercloud.dev", uiUrl)?.origin).toBe(
      "https://crons.mysupercloud.dev",
    );
  });

  it("rejects unknown origins", () => {
    expect(parseOAuthReturnTo("https://evil.example", uiUrl)).toBeNull();
    expect(parseOAuthReturnTo("javascript:alert(1)", uiUrl)).toBeNull();
    expect(parseOAuthReturnTo("", uiUrl)).toBeNull();
  });
});

describe("localOAuthRedirectUri", () => {
  it("uses the Authelia-registered localhost callback", () => {
    expect(localOAuthRedirectUri).toBe("http://localhost:9988/callback");
  });
});

describe("resolveOAuthRedirectUri", () => {
  const apiUrl = "https://crons.mysupercloud.dev/api";

  it("uses localhost callback only for local return_to origins", () => {
    const localReturnTo = parseOAuthReturnTo(
      "http://localhost:3000",
      "https://crons.mysupercloud.dev",
    );
    expect(resolveOAuthRedirectUri(localReturnTo, apiUrl)).toBe(
      localOAuthRedirectUri,
    );
  });

  it("uses API callback for production UI return_to", () => {
    const productionReturnTo = parseOAuthReturnTo(
      "https://crons.mysupercloud.dev",
      "https://crons.mysupercloud.dev",
    );
    expect(resolveOAuthRedirectUri(productionReturnTo, apiUrl)).toBe(
      "https://crons.mysupercloud.dev/api/callback",
    );
  });

  it("uses API callback when return_to is absent", () => {
    expect(resolveOAuthRedirectUri(null, apiUrl)).toBe(
      "https://crons.mysupercloud.dev/api/callback",
    );
  });
});

describe("isLocalOAuthReturnTo", () => {
  it("detects localhost and 127.0.0.1", () => {
    expect(isLocalOAuthReturnTo(new URL("http://localhost:3000"))).toBe(true);
    expect(isLocalOAuthReturnTo(new URL("http://127.0.0.1:3000"))).toBe(true);
    expect(
      isLocalOAuthReturnTo(new URL("https://crons.mysupercloud.dev")),
    ).toBe(false);
  });
});

describe("cookieSecureForUrl", () => {
  it("is secure only for https URLs", () => {
    expect(cookieSecureForUrl("http://localhost:3000")).toBe(false);
    expect(cookieSecureForUrl("https://crons.mysupercloud.dev")).toBe(true);
  });
});
