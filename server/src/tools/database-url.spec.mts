import { describe, expect, it } from "vitest";

import { isUsableDatabaseUrl, resolveDatabaseUrl } from "./database-url.mts";

describe("resolveDatabaseUrl", () => {
  it("prefers DATABASE_URL over POSTGRES_*", () => {
    const url = resolveDatabaseUrl({
      DATABASE_URL: "postgres://prod:secret@10.0.0.1/timelord",
      POSTGRES_USERNAME: "postgres",
      POSTGRES_PASSWORD: "local",
      POSTGRES_HOSTNAME: "localhost",
      POSTGRES_PORT: "5439",
      POSTGRES_DATABASE: "postgres",
    });

    expect(url).toBe("postgres://prod:secret@10.0.0.1/timelord");
  });

  it("builds from POSTGRES_* when DATABASE_URL is the fnox placeholder", () => {
    const url = resolveDatabaseUrl({
      DATABASE_URL: "_",
      POSTGRES_USERNAME: "timelord",
      POSTGRES_PASSWORD: "pw",
      POSTGRES_HOSTNAME: "10.20.4.15",
      POSTGRES_PORT: "5432",
      POSTGRES_DATABASE: "timelord",
    });

    expect(url).toBe("postgresql://timelord:pw@10.20.4.15:5432/timelord");
  });

  it("builds from POSTGRES_* when DATABASE_URL is unset", () => {
    const url = resolveDatabaseUrl({
      POSTGRES_USERNAME: "postgres",
      POSTGRES_PASSWORD: "mysecret",
      POSTGRES_HOSTNAME: "localhost",
      POSTGRES_PORT: "5439",
      POSTGRES_DATABASE: "postgres",
    });

    expect(url).toBe(
      "postgresql://postgres:mysecret@localhost:5439/postgres",
    );
  });
});

describe("isUsableDatabaseUrl", () => {
  it("rejects empty and placeholder values", () => {
    expect(isUsableDatabaseUrl(undefined)).toBe(false);
    expect(isUsableDatabaseUrl("")).toBe(false);
    expect(isUsableDatabaseUrl("   ")).toBe(false);
    expect(isUsableDatabaseUrl("_")).toBe(false);
    expect(isUsableDatabaseUrl("postgres://localhost/db")).toBe(true);
  });
});
