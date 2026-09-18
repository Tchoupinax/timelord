import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "#prisma-run";
import { DEV_LIVE_STREAM_JOB_ID, DEV_USER_ID } from "../src/dev-user.mts";
import { resolveDatabaseUrl } from "./database-url.mts";

const INTERVAL_MS = 2_000;
const LINES_PER_TICK = 3;

const adapter = new PrismaPg({ connectionString: resolveDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

function logLine(index: number) {
  const ts = new Date().toISOString();
  return `[${index.toString().padStart(5, "0")}] ${ts} streamed log line for live UI test`;
}

async function nextLogIndex() {
  const result = await prisma.log.aggregate({
    where: { jobId: DEV_LIVE_STREAM_JOB_ID },
    _max: { index: true },
  });
  return (result._max.index ?? -1) + 1;
}

async function appendLogs(startIndex: number) {
  await prisma.log.createMany({
    data: Array.from({ length: LINES_PER_TICK }, (_, offset) => {
      const index = startIndex + offset;
      return {
        jobId: DEV_LIVE_STREAM_JOB_ID,
        content: logLine(index),
        index,
        type: "stdout",
        userId: DEV_USER_ID,
      };
    }),
  });

  await prisma.job.update({
    where: { id: DEV_LIVE_STREAM_JOB_ID },
    data: { updatedAt: new Date(), statusCode: -1 },
  });

  return startIndex + LINES_PER_TICK;
}

async function main() {
  const job = await prisma.job.findUnique({
    where: { id: DEV_LIVE_STREAM_JOB_ID },
  });

  if (!job) {
    console.error(
      `Job ${DEV_LIVE_STREAM_JOB_ID} not found. Run pnpm seed in server first.`,
    );
    process.exit(1);
  }

  let index = await nextLogIndex();
  console.log(
    `Appending ${LINES_PER_TICK} log lines every ${INTERVAL_MS}ms to "${job.title}" (${DEV_LIVE_STREAM_JOB_ID}). Ctrl+C to stop.`,
  );

  index = await appendLogs(index);
  console.log(`Wrote initial batch at log index ${index - LINES_PER_TICK}.`);

  const timer = setInterval(() => {
    void appendLogs(index).then(next => {
      index = next;
    });
  }, INTERVAL_MS);

  const shutdown = async () => {
    clearInterval(timer);
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

main().catch(async error => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
