-- Add PUSH to NotificationChannel enum
ALTER TYPE "NotificationChannel" ADD VALUE 'PUSH';

-- CreateTable
CREATE TABLE "email_events" (
    "id" UUID NOT NULL,
    "delivery_id" UUID,
    "external_id" TEXT NOT NULL,
    "svix_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw" JSONB,

    CONSTRAINT "email_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_events_external_id_idx" ON "email_events"("external_id");

-- CreateIndex
CREATE INDEX "email_events_delivery_id_idx" ON "email_events"("delivery_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_events_svix_id_key" ON "email_events"("svix_id");

-- CreateIndex
CREATE INDEX "notification_deliveries_external_id_idx" ON "notification_deliveries"("external_id");
