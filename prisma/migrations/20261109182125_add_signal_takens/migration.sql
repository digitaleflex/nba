-- Tracking simple pris / pas pris (idempotent pour shadow DB casse)
CREATE TABLE IF NOT EXISTS "signal_takens" (
    "id" UUID NOT NULL,
    "signal_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "traded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "signal_takens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "signal_takens_signal_id_user_id_key" ON "signal_takens"("signal_id", "user_id");
CREATE INDEX IF NOT EXISTS "signal_takens_signal_id_idx" ON "signal_takens"("signal_id");
CREATE INDEX IF NOT EXISTS "signal_takens_user_id_idx" ON "signal_takens"("user_id");
CREATE INDEX IF NOT EXISTS "signal_takens_user_id_traded_at_idx" ON "signal_takens"("user_id", "traded_at");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'signal_takens_signal_id_fkey') THEN
    ALTER TABLE "signal_takens" ADD CONSTRAINT "signal_takens_signal_id_fkey" FOREIGN KEY ("signal_id") REFERENCES "signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'signal_takens_user_id_fkey') THEN
    ALTER TABLE "signal_takens" ADD CONSTRAINT "signal_takens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
