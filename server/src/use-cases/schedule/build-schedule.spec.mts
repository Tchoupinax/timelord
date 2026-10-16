import { describe, expect, it } from "vitest";

import {
  buildScheduleEntries,
  classifyPeriodJob,
  type ScheduleJob,
  type ScheduleScript,
} from "./build-schedule.mts";

const now = new Date("2026-06-23T10:30:00.000Z");

function script(override: Partial<ScheduleScript> = {}): ScheduleScript {
  return {
    title: "Nightly backup",
    hostname: "machine-a",
    cron: "0 * * * *",
    timezone: "",
    timezoneInvalid: false,
    ...override,
  };
}

function job(override: Partial<ScheduleJob> = {}): ScheduleJob {
  return {
    title: "Nightly backup",
    hostname: "machine-a",
    createdAt: new Date("2026-06-23T10:05:00.000Z"),
    statusCode: 0,
    finalState: "Success",
    cancelRequestedAt: null,
    ...override,
  };
}

describe("classifyPeriodJob", () => {
  it("reports the script final state when the process exited cleanly", () => {
    expect(classifyPeriodJob(job({ finalState: "Warning" }))).toBe("warning");
    expect(classifyPeriodJob(job({ finalState: "Error" }))).toBe("error");
    expect(classifyPeriodJob(job({ finalState: "Success" }))).toBe("success");
  });

  it("reports a running or cancelled job ahead of the final state", () => {
    expect(classifyPeriodJob(job({ statusCode: -1, finalState: null }))).toBe("running");
    expect(
      classifyPeriodJob(job({ cancelRequestedAt: new Date("2026-06-23T10:06:00.000Z") })),
    ).toBe("cancelled");
  });
});

describe("buildScheduleEntries", () => {
  it("lists the next fires and whether the open period succeeded", () => {
    const entries = buildScheduleEntries([script()], [job()], now);

    expect(entries).toEqual([
      {
        title: "Nightly backup",
        hostname: "machine-a",
        cron: "0 * * * *",
        timezone: null,
        timezoneInvalid: false,
        openPeriod: {
          start: "2026-06-23T10:00:00.000Z",
          end: "2026-06-23T11:00:00.000Z",
          state: "success",
        },
        nextFires: [
          "2026-06-23T11:00:00.000Z",
          "2026-06-23T12:00:00.000Z",
          "2026-06-23T13:00:00.000Z",
          "2026-06-23T14:00:00.000Z",
        ],
      },
    ]);
  });

  it("stays waiting when this period has no job on that agent", () => {
    const entries = buildScheduleEntries(
      [script()],
      [job({ hostname: "machine-b" })],
      now,
    );

    expect(entries[0]?.openPeriod.state).toBe("waiting");
  });

  it("uses the latest attempt inside the period", () => {
    const entries = buildScheduleEntries(
      [script()],
      [
        job({ statusCode: 1, finalState: "Error" }),
        job({
          createdAt: new Date("2026-06-23T10:20:00.000Z"),
          statusCode: -1,
          finalState: null,
        }),
      ],
      now,
    );

    expect(entries[0]?.openPeriod.state).toBe("running");
  });

  it("sorts scripts by their next fire and honors the timezone", () => {
    const entries = buildScheduleEntries(
      [
        script({
          title: "Morning report",
          cron: "0 9 * * *",
          timezone: "Europe/Paris",
        }),
        script({ title: "Hourly" }),
      ],
      [],
      new Date("2026-01-15T08:30:00.000Z"),
    );

    expect(entries.map(entry => entry.title)).toEqual(["Hourly", "Morning report"]);
    expect(entries[1]?.nextFires[0]).toBe("2026-01-16T08:00:00.000Z");
    expect(entries[1]?.openPeriod).toEqual({
      start: "2026-01-15T08:00:00.000Z",
      end: "2026-01-16T08:00:00.000Z",
      state: "waiting",
    });
  });

  it("skips scripts that have no schedule", () => {
    expect(buildScheduleEntries([script({ cron: "  " })], [], now)).toEqual([]);
  });
});
