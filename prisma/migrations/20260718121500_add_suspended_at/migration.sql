-- Add suspendedAt timestamp to trace suspension (second-precision) for user-facing display
ALTER TABLE "users" ADD COLUMN "suspended_at" TIMESTAMP(3);

CREATE INDEX "users_suspended_at_idx" ON "users"("suspended_at");
