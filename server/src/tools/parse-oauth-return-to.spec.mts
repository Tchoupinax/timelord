import { describe, expect, it } from "vitest";

import {
  cookieSecureForUrl,
  parseOAuthReturnTo,
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

describe("cookieSecureForUrl", () => {
  it("is secure only for https URLs", () => {
    expect(cookieSecureForUrl("http://localhost:3000")).toBe(false);
    expect(cookieSecureForUrl("https://crons.mysupercloud.dev")).toBe(true);
  });
});
