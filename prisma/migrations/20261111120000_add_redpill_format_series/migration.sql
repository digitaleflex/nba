-- Redpills : format au choix (TEXT/IMAGE/AUDIO/VIDEO/MIXED) + séries
ALTER TABLE "redpills" ADD COLUMN IF NOT EXISTS "format" TEXT NOT NULL DEFAULT 'MIXED';
ALTER TABLE "redpills" ADD COLUMN IF NOT EXISTS "series" TEXT;
ALTER TABLE "redpills" ADD COLUMN IF NOT EXISTS "episode" INTEGER;
CREATE INDEX IF NOT EXISTS "redpills_series_idx" ON "redpills"("series");
