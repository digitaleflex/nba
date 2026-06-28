-- AlterTable
ALTER TABLE "signals" ADD COLUMN     "current_version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "imageUrls" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "job_id" TEXT,
ADD COLUMN     "scheduled_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "signal_versions" (
    "id" UUID NOT NULL,
    "signal_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrls" JSONB NOT NULL DEFAULT '[]',
    "updated_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signal_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signal_reads" (
    "id" UUID NOT NULL,
    "signal_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "view_count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "signal_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signal_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "signal_versions_signal_id_version_key" ON "signal_versions"("signal_id", "version");

-- CreateIndex
CREATE INDEX "signal_reads_signal_id_idx" ON "signal_reads"("signal_id");

-- CreateIndex
CREATE INDEX "signal_reads_user_id_idx" ON "signal_reads"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "signal_reads_signal_id_user_id_key" ON "signal_reads"("signal_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "signal_templates_name_key" ON "signal_templates"("name");

-- CreateIndex
CREATE INDEX "signals_scheduled_at_idx" ON "signals"("scheduled_at");

-- AddForeignKey
ALTER TABLE "signal_versions" ADD CONSTRAINT "signal_versions_signal_id_fkey" FOREIGN KEY ("signal_id") REFERENCES "signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_versions" ADD CONSTRAINT "signal_versions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_reads" ADD CONSTRAINT "signal_reads_signal_id_fkey" FOREIGN KEY ("signal_id") REFERENCES "signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_reads" ADD CONSTRAINT "signal_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
