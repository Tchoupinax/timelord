export const CANCEL_EXIT_CODE = 130;

export const isJobCancelled = (job: {
  statusCode?: number | null;
  statusComment?: string | null;
}) =>
  job.statusCode === CANCEL_EXIT_CODE ||
  job.statusComment === "Cancelled by user";
