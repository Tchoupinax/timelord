import { describe, expect, it } from "vitest";

import {
  buildCronPeriodAttemptWhere,
  getCronPeriodStart,
} from "./cron-period.mts";

describe("getCronPeriodStart", () => {
  it("returns null when the cron period is unknown", () => {
    expect(getCronPeriodStart({ nextDate: "" })).toBeNull();
    expect(getCronPeriodStart({ nextDate: "not-a-date" })).toBeNull();
  });

  it("parses the cron period start date", () => {
    expect(getCronPeriodStart({ nextDate: "2026-08-19T10:00:00.000Z" })).toEqual(
      new Date("2026-08-19T10:00:00.000Z"),
    );
  });
});

describe("buildCronPeriodAttemptWhere", () => {
  it("matches any attempt in the current cron period", () => {
    const periodStart = new Date("2026-08-19T10:00:00.000Z");

    expect(
      buildCronPeriodAttemptWhere({
        userId: "user-1",
        hostname: "agent-a",
        title: "Backup",
        periodStart,
      }),
    ).toEqual({
      userId: "user-1",
      hostname: "agent-a",
      title: "Backup",
      createdAt: {
        gte: periodStart,
      },
    });
  });
});
