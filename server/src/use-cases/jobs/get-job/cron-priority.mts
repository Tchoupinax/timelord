import type { Metadata } from "#src/functions/extract-metadata.mts";

export type CronPriorityOptions = {
  now?: Date;
  startWindowMinutes?: number;
};

export function getMinutesSincePeriodStart(
  metadata: Metadata,
  now: Date,
): number | null {
  if (!metadata.nextDate) {
    return null;
  }

  const periodStart = new Date(metadata.nextDate);
  if (Number.isNaN(periodStart.getTime())) {
    return null;
  }

  return (now.getTime() - periodStart.getTime()) / 60_000;
}

export function cronUrgencyScore(
  metadata: Metadata,
  startWindowMinutes: number,
  now: Date,
): number {
  const elapsed = getMinutesSincePeriodStart(metadata, now);
  if (elapsed === null || elapsed < 0) {
    return -1;
  }

  if (elapsed > startWindowMinutes) {
    return 1_000 + elapsed;
  }

  return elapsed;
}

export function isCronDueForStart(
  metadata: Metadata,
  startWindowMinutes: number,
  now: Date,
): boolean {
  const elapsed = getMinutesSincePeriodStart(metadata, now);
  return elapsed !== null && elapsed >= 0;
}

export function isCronPastStartWindow(
  metadata: Metadata,
  startWindowMinutes: number,
  now: Date,
): boolean {
  const elapsed = getMinutesSincePeriodStart(metadata, now);
  return elapsed !== null && elapsed > startWindowMinutes;
}

export function getActiveCronJobs(
  metadataFiles: Array<Metadata>,
  options: CronPriorityOptions = {},
): Array<{ metadata: Metadata; index: number }> {
  const now = options.now ?? new Date();
  const startWindowMinutes = options.startWindowMinutes ?? 5;

  return metadataFiles
    .map((metadata, index) => ({ metadata, index }))
    .filter(({ metadata }) => metadata.cronIsActive)
    .sort(
      (a, b) =>
        cronUrgencyScore(b.metadata, startWindowMinutes, now) -
        cronUrgencyScore(a.metadata, startWindowMinutes, now),
    );
}
