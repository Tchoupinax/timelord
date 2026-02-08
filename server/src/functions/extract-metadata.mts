import { CronExpressionParser } from "cron-parser";

export type Metadata = {
  cron?: string;
  cronIsActive: boolean;
  nextDate?: string;
  title: string;
  keepLastCount?: number;
};

const SECONDS = 1000;

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

    const interval = CronExpressionParser.parse(cron);
    nextDate = interval.next().toDate();

    const diff = Math.abs(nextDate.getTime() - now.getTime());
    if (diff < 30 * SECONDS) {
      cronIsActive = true;
    }
  }

  function capitalizeFirstLetter(str: string): string {
    if (!str) return "";
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
