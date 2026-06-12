export type ActivityItem = {
  id: string;
  type:
    | "job_running"
    | "job_succeeded"
    | "job_failed"
    | "job_started"
    | "job_queued";
  title: string;
  message: string;
  timestamp: string;
  jobId?: string;
  hostname?: string | null;
  statusComment?: string | null;
};
