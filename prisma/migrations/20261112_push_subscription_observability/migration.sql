ALTER TABLE "push_subscriptions"
  ADD COLUMN "platform" TEXT,
  ADD COLUMN "browser" TEXT,
  ADD COLUMN "standalone" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "last_success_at" TIMESTAMP(3),
  ADD COLUMN "last_failure_at" TIMESTAMP(3),
  ADD COLUMN "last_error_code" INTEGER,
  ADD COLUMN "failure_count" INTEGER NOT NULL DEFAULT 0;
