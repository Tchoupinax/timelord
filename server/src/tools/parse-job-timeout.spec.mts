import { describe, expect, it } from "vitest";

import {
  parseJobTimeoutMinutes,
  parseOptionalJobTimeoutMinutes,
} from "./parse-job-timeout.mts";

describe("parseOptionalJobTimeoutMinutes", () => {
  it("returns null when unset", () => {
    expect(parseOptionalJobTimeoutMinutes(undefined)).toBeNull();
    expect(parseOptionalJobTimeoutMinutes("  ")).toBeNull();
  });

  it("parses script timeout", () => {
    expect(parseOptionalJobTimeoutMinutes("12h")).toBe(12 * 60);
  });
});

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
