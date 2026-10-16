import {
  currentCronPeriod,
  NEXT_FIRE_COUNT,
  nextFireDates,
} from "../../functions/cron-schedule.mts";

export type PeriodState =
  | "success"
  | "warning"
  | "error"
  | "running"
  | "waiting"
  | "cancelled";

export type ScheduleScript = {
  title: string;
  hostname: string;
  cron: string;
  timezone: string;
  timezoneInvalid: boolean;
};

export type ScheduleJob = {
  title: string | null;
  hostname: string | null;
  createdAt: Date;
  statusCode: number | null;
  finalState: string | null;
  cancelRequestedAt: Date | null;
};

export type ScheduleEntry = {
  title: string;
  hostname: string;
  cron: string;
  timezone: string | null;
  timezoneInvalid: boolean;
  openPeriod: {
    start: string;
    end: string;
    state: PeriodState;
  };
  nextFires: Array<string>;
};

export function classifyPeriodJob(job: ScheduleJob): PeriodState {
  if (job.cancelRequestedAt) {
    return "cancelled";
  }

  if (job.statusCode === -1 || job.statusCode === null) {
    return "running";
  }

  if (job.statusCode !== 0 || job.finalState === "Error") {
    return "error";
  }

  if (job.finalState === "Warning") {
    return "warning";
  }

  return "success";
}

function effectiveTimezone(script: ScheduleScript): string | undefined {
  if (!script.timezone || script.timezoneInvalid) {
    return undefined;
  }

  return script.timezone;
}

export function openPeriodBounds(
  script: ScheduleScript,
  now: Date,
): { start: Date; end: Date } {
  return currentCronPeriod(script.cron, now, effectiveTimezone(script));
}

function latestJobInPeriod(
  script: ScheduleScript,
  jobs: Array<ScheduleJob>,
  start: Date,
  end: Date,
): ScheduleJob | undefined {
  const startMs = start.getTime();
  const endMs = end.getTime();

  return jobs
    .filter(job => {
      if ((job.title ?? "") !== script.title) {
        return false;
      }

      if ((job.hostname ?? "").toLowerCase() !== script.hostname.toLowerCase()) {
        return false;
      }

      const createdAt = job.createdAt.getTime();
      return createdAt >= startMs && createdAt < endMs;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

export function buildScheduleEntries(
  scripts: Array<ScheduleScript>,
  jobs: Array<ScheduleJob>,
  now: Date,
): Array<ScheduleEntry> {
  const entries = scripts
    .filter(script => script.cron.trim().length > 0)
    .map(script => {
      const timezone = effectiveTimezone(script);
      const period = currentCronPeriod(script.cron, now, timezone);
      const job = latestJobInPeriod(script, jobs, period.start, period.end);

      return {
        title: script.title,
        hostname: script.hostname,
        cron: script.cron,
        timezone: script.timezone || null,
        timezoneInvalid: script.timezoneInvalid,
        openPeriod: {
          start: period.start.toISOString(),
          end: period.end.toISOString(),
          state: job ? classifyPeriodJob(job) : "waiting",
        },
        nextFires: nextFireDates(script.cron, now, NEXT_FIRE_COUNT, timezone).map(date =>
          date.toISOString(),
        ),
      } satisfies ScheduleEntry;
    });

  return entries.sort((a, b) => {
    const aTime = Date.parse(a.nextFires[0] ?? "");
    const bTime = Date.parse(b.nextFires[0] ?? "");

    if (aTime !== bTime) {
      return aTime - bTime;
    }

    return a.title.localeCompare(b.title);
  });
}
