import { CronExpressionParser } from "cron-parser";

export type Metadata = {
  cron?: string;
  cronIsActive: boolean;
  nextDate?: string;
  title: string;
  keepLastCount?: number;
};

export function extractMetadata(file: string): Metadata {
  const now = new Date();
  let nextDate: Date | undefined = undefined;
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
    const periodEnd = interval.next().toDate();

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

  return {
    cron,
    nextDate: nextDate?.toISOString() ?? "",
    cronIsActive,
    title,
    keepLastCount,
  };
}
