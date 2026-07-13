-- DropIndex
DROP INDEX IF EXISTS "email_reputation_history_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "email_reputation_history_date_window_key" ON "email_reputation_history"("date", "window");
