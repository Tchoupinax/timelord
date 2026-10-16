import { CronExpressionParser } from "cron-parser";

export const NEXT_FIRE_COUNT = 4;

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function parseOptions(now: Date, timezone?: string) {
  if (!timezone) {
    return { currentDate: now };
  }

  return { currentDate: now, tz: timezone };
}

/** The cron period that contains `now`: previous fire through the next one. */
export function currentCronPeriod(
  cron: string,
  now: Date,
  timezone?: string,
): { start: Date; end: Date } {
  const interval = CronExpressionParser.parse(cron, parseOptions(now, timezone));
  const start = interval.prev().toDate();
  const end = interval.next().toDate();

  return { start, end };
}

/** The next times `When` opens, not including a fire that has already passed. */
export function nextFireDates(
  cron: string,
  now: Date,
  count: number,
  timezone?: string,
): Array<Date> {
  const interval = CronExpressionParser.parse(cron, parseOptions(now, timezone));
  const dates: Array<Date> = [];

  for (let index = 0; index < count; index++) {
    dates.push(interval.next().toDate());
  }

  return dates;
}
