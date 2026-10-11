-- Lease-based queue: entries are leased on dispatch and only deleted on success,
-- otherwise redelivered until max_attempts is reached (at-least-once delivery).
ALTER TABLE "job_queue"
  ADD COLUMN "leased_at" TIMESTAMP(3),
  ADD COLUMN "leased_job_id" TEXT,
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "max_attempts" INTEGER NOT NULL DEFAULT 1;
