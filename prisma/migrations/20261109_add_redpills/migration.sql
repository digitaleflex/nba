-- Redpills d'Emerson (idempotent)
CREATE TABLE IF NOT EXISTS "redpills" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "content" TEXT,
  "audio_url" TEXT,
  "image_url" TEXT,
  "video_url" TEXT,
  "is_published" BOOLEAN NOT NULL DEFAULT true,
  "published_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "redpills_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "redpills_is_published_published_at_idx" ON "redpills"("is_published", "published_at");
CREATE INDEX IF NOT EXISTS "redpills_created_by_idx" ON "redpills"("created_by");
DO $$ BEGIN
  ALTER TABLE "redpills" ADD CONSTRAINT "redpills_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "redpill_reads" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "redpill_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "read_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "redpill_reads_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "redpill_reads" ADD CONSTRAINT "redpill_reads_redpill_id_fkey" FOREIGN KEY ("redpill_id") REFERENCES "redpills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "redpill_reads" ADD CONSTRAINT "redpill_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "redpill_reads_redpill_id_user_id_key" ON "redpill_reads"("redpill_id", "user_id");
CREATE INDEX IF NOT EXISTS "redpill_reads_redpill_id_idx" ON "redpill_reads"("redpill_id");
CREATE INDEX IF NOT EXISTS "redpill_reads_user_id_idx" ON "redpill_reads"("user_id");
