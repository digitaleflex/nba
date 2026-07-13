-- AlterTable
ALTER TABLE "email_events" ADD COLUMN     "click_link" TEXT;

-- CreateIndex
CREATE INDEX "email_events_type_idx" ON "email_events"("type");
