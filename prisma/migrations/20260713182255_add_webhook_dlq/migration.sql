-- CreateEnum
CREATE TYPE "DlqStatus" AS ENUM ('PENDING', 'REPLAYED', 'ABANDONED');

-- CreateTable
CREATE TABLE "webhook_dlq" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'resend',
    "event_type" TEXT NOT NULL,
    "svix_id" TEXT,
    "external_id" TEXT,
    "payload" JSONB NOT NULL,
    "raw_body" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "last_error" TEXT,
    "status" "DlqStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "replayed_at" TIMESTAMP(3),
    "abandoned_at" TIMESTAMP(3),

    CONSTRAINT "webhook_dlq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_dlq_status_idx" ON "webhook_dlq"("status");

-- CreateIndex
CREATE INDEX "webhook_dlq_source_event_type_idx" ON "webhook_dlq"("source", "event_type");

-- CreateIndex
CREATE INDEX "webhook_dlq_created_at_idx" ON "webhook_dlq"("created_at");

-- CreateIndex
CREATE INDEX "webhook_dlq_svix_id_idx" ON "webhook_dlq"("svix_id");

