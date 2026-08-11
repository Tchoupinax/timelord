const DEFAULT_TIMEOUT_MINUTES = 30;

export function parseJobTimeoutMinutes(timeout: string): number {
  const match = timeout.trim().match(/^(\d+)\s*([hms])?$/i);
  if (!match) {
    return DEFAULT_TIMEOUT_MINUTES;
  }

  const value = Number.parseInt(match[1] as string, 10);
  if (Number.isNaN(value) || value <= 0) {
    return DEFAULT_TIMEOUT_MINUTES;
  }

  const unit = (match[2] ?? "m").toLowerCase();
  switch (unit) {
    case "h":
      return value * 60;
    case "s":
      return Math.max(1, Math.ceil(value / 60));
    default:
      return value;
  }
}
