import { CronExpressionParser } from "cron-parser";

export type Metadata = {
  cron?: string;
  cronIsActive: boolean;
  nextDate?: string;
  periodEnd?: string;
  title: string;
  keepLastCount?: number;
  /** Raw value from `#>> Timeout:` (e.g. `12h`). */
  jobTimeout?: string;
  /** Max dispatch attempts from `#>> Retry:` (e.g. `3`). Undefined = use default. */
  maxAttempts?: number;
};

export function extractMetadata(file: string): Metadata {
  const now = new Date();
  let nextDate: Date | undefined = undefined;
  let periodEnd: Date | undefined = undefined;
  let cron = "";
  let title = "";
  let keepLastCount = -1;
  let cronIsActive = false;

  const regex = "#>> When: (.*)";

  const found = file.match(regex);
  if (found && found?.length > 0) {
    cron = found[1] as string;

    const interval = CronExpressionParser.parse(cron, { currentDate: now });
    const periodStart = interval.prev().toDate();
    periodEnd = interval.next().toDate();

    // Keep the job eligible for the whole cron period, not only 30 seconds
    // before the next fire. The old window caused missed runs when every agent
    // was busy during that short interval.
    nextDate = periodStart;
    cronIsActive = now >= periodStart && now <= periodEnd;
  }

  function capitalizeFirstLetter(str: string): string {
    if (!str) {
      return "";
    }

    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const titleRegex = "#>> What: (.*)";
  const titleFound = file.match(titleRegex);
  if (titleFound && titleFound?.length > 0) {
    title = titleFound[1] as string;
  } else {
    title = capitalizeFirstLetter(
      file?.split("/")?.at(-1)?.split(".")?.at(0)?.replaceAll("-", " ") ?? "",
    );
  }

  const keepLastRegex = "#>> KeepLast: (.*)";
  const keepLastFound = file.match(keepLastRegex);
  if (keepLastFound && keepLastFound?.length > 0) {
    keepLastCount = parseInt(keepLastFound[1] as string, 10);
    if (Number.isNaN(keepLastCount)) {
      keepLastCount = -1;
    }
  }

  const timeoutRegex = "#>> Timeout: (.*)";
  const timeoutFound = file.match(timeoutRegex);
  const jobTimeout =
    timeoutFound && timeoutFound.length > 0
      ? (timeoutFound[1] as string).trim()
      : undefined;

  // `#>> Retry: N` opts a queued job into at-least-once delivery with up to N
  // total attempts. Absent or invalid means "use the server default".
  const retryRegex = "#>> Retry: (.*)";
  const retryFound = file.match(retryRegex);
  let maxAttempts: number | undefined;
  if (retryFound && retryFound.length > 0) {
    const parsed = parseInt((retryFound[1] as string).trim(), 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      maxAttempts = parsed;
    }
  }

  return {
    cron,
    nextDate: nextDate?.toISOString() ?? "",
    periodEnd: periodEnd?.toISOString() ?? "",
    cronIsActive,
    title,
    keepLastCount,
    jobTimeout,
    maxAttempts,
  };
}
