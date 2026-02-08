import { startServer } from "./server.mts";
import { timeoutOldJobs } from "./use-cases/jobs/timeout-old-jobs.mts";

const MINUTES = 1000 * 60;
// eslint-disable-next-line @typescript-eslint/no-misused-promises
setInterval(async () => {
  await timeoutOldJobs();
}, 1 * MINUTES);

void startServer();
