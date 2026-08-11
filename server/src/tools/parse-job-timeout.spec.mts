import { describe, expect, it } from "vitest";

import { parseJobTimeoutMinutes } from "./parse-job-timeout.mts";

describe("parseJobTimeoutMinutes", () => {
  it("parses hours", () => {
    expect(parseJobTimeoutMinutes("1h")).toBe(60);
    expect(parseJobTimeoutMinutes("2H")).toBe(120);
  });

  it("parses minutes", () => {
    expect(parseJobTimeoutMinutes("30m")).toBe(30);
    expect(parseJobTimeoutMinutes("45")).toBe(45);
  });

  it("parses seconds as at least one minute", () => {
    expect(parseJobTimeoutMinutes("120s")).toBe(2);
    expect(parseJobTimeoutMinutes("30s")).toBe(1);
  });

  it("falls back to thirty minutes for invalid values", () => {
    expect(parseJobTimeoutMinutes("")).toBe(30);
    expect(parseJobTimeoutMinutes("invalid")).toBe(30);
    expect(parseJobTimeoutMinutes("0m")).toBe(30);
  });
});
