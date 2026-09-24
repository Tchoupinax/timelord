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

/** Dispatch time (`createdAt`), not `updatedAt` (bumped on logs/completion). */
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
