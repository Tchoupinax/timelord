import "./instrumentation.mts";
import { startServer } from "./server.mts";
import { timeoutOldJobs } from "./use-cases/jobs/timeout-old-jobs.mts";

const MINUTES = 1000 * 60;
setInterval(() => {
  void timeoutOldJobs();
}, 1 * MINUTES);

void startServer();
