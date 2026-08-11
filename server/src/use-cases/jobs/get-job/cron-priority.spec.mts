import { describe, expect, it } from "vitest";

import type { Metadata } from "#src/functions/extract-metadata.mts";

import {
  cronUrgencyScore,
  getActiveCronJobs,
  getMinutesSincePeriodStart,
  isCronDueForStart,
  isCronPastStartWindow,
} from "./cron-priority.mts";

function metadata(
  override: Partial<Metadata> & Pick<Metadata, "title">,
): Metadata {
  return {
    cronIsActive: false,
    keepLastCount: -1,
    ...override,
  };
}

describe("cron priority", () => {
  const now = new Date("2026-06-23T10:04:00.000Z");
  const startWindowMinutes = 5;

  it("scores overdue jobs higher than jobs still in the start window", () => {
    const inWindow = metadata({
      title: "in-window",
      nextDate: "2026-06-23T10:02:00.000Z",
    });
    const overdue = metadata({
      title: "overdue",
      nextDate: "2026-06-23T09:00:00.000Z",
    });

    expect(cronUrgencyScore(overdue, startWindowMinutes, now)).toBeGreaterThan(
      cronUrgencyScore(inWindow, startWindowMinutes, now),
    );
  });

  it("returns active cron jobs sorted by urgency", () => {
    const files = [
      metadata({
        title: "in-window",
        cronIsActive: true,
        nextDate: "2026-06-23T10:02:00.000Z",
      }),
      metadata({ title: "inactive", cronIsActive: false }),
      metadata({
        title: "overdue",
        cronIsActive: true,
        nextDate: "2026-06-23T09:00:00.000Z",
      }),
    ];

    expect(
      getActiveCronJobs(files, { now, startWindowMinutes }).map(
        ({ metadata: job }) => job.title,
      ),
    ).toEqual(["overdue", "in-window"]);
  });

  it("detects when a cron is due and past the start window", () => {
    const due = metadata({
      title: "due",
      nextDate: "2026-06-23T10:00:00.000Z",
    });

    expect(getMinutesSincePeriodStart(due, now)).toBe(4);
    expect(isCronDueForStart(due, startWindowMinutes, now)).toBe(true);
    expect(isCronPastStartWindow(due, startWindowMinutes, now)).toBe(false);
  });
});
