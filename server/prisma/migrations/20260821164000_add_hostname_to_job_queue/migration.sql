-- AlterTable
ALTER TABLE "job_queue" ADD COLUMN "hostname" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "job_queue" DROP CONSTRAINT "job_queue_pkey",
ADD CONSTRAINT "job_queue_pkey" PRIMARY KEY ("title", "user_id", "hostname");
