import type { Metadata } from "#src/functions/extract-metadata.mts";

export function getCronPeriodStart(
  metadata: Pick<Metadata, "nextDate">,
): Date | null {
  if (!metadata.nextDate) {
    return null;
  }

  const periodStart = new Date(metadata.nextDate);
  return Number.isNaN(periodStart.getTime()) ? null : periodStart;
}

export function buildCronPeriodAttemptWhere(params: {
  userId: string;
  hostname: string;
  title: string;
  periodStart: Date;
}) {
  return {
    userId: params.userId,
    hostname: params.hostname,
    title: params.title,
    createdAt: {
      gte: params.periodStart,
    },
  };
}
