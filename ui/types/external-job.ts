export type ExternalJob = {
  id: string;
  hostname: string | null;
  createdAt: Date;
  updatedAt: Date;
  title: string | null;
  cron: string | null;
  statusCode: number | null;
  userId: string | null;
  statusComment: string | null;
  nextPlannedExecution: string | null;
  neverExecuted: boolean;
  queuePending: boolean;
  keepLastCount: number;
  finalState: string;
};
