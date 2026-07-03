/*
  Warnings:

  - You are about to drop the column `selfie_file_path` on the `kyc_documents` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OnboardingStatus" ADD VALUE 'REGISTERED';
ALTER TYPE "OnboardingStatus" ADD VALUE 'PAYMENT_PENDING';
ALTER TYPE "OnboardingStatus" ADD VALUE 'PAYMENT_CONFIRMED';
ALTER TYPE "OnboardingStatus" ADD VALUE 'KYC_APPROVED';
ALTER TYPE "OnboardingStatus" ADD VALUE 'BROKER_APPROVED';
ALTER TYPE "OnboardingStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "kyc_documents" DROP COLUMN "selfie_file_path";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "onboarding_status" SET DEFAULT 'REGISTERED';

-- CreateTable
CREATE TABLE "signal_favorites" (
    "id" UUID NOT NULL,
    "signal_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signal_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signal_archives" (
    "id" UUID NOT NULL,
    "signal_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signal_archives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "signal_favorites_signal_id_idx" ON "signal_favorites"("signal_id");

-- CreateIndex
CREATE INDEX "signal_favorites_user_id_idx" ON "signal_favorites"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "signal_favorites_signal_id_user_id_key" ON "signal_favorites"("signal_id", "user_id");

-- CreateIndex
CREATE INDEX "signal_archives_signal_id_idx" ON "signal_archives"("signal_id");

-- CreateIndex
CREATE INDEX "signal_archives_user_id_idx" ON "signal_archives"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "signal_archives_signal_id_user_id_key" ON "signal_archives"("signal_id", "user_id");

-- CreateIndex
CREATE INDEX "access_requests_user_id_plan_id_status_idx" ON "access_requests"("user_id", "plan_id", "status");

-- CreateIndex
CREATE INDEX "broker_verifications_status_idx" ON "broker_verifications"("status");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "signals_deleted_at_idx" ON "signals"("deleted_at");

-- CreateIndex
CREATE INDEX "signals_status_deleted_at_idx" ON "signals"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "signals_status_created_at_idx" ON "signals"("status", "created_at");

-- AddForeignKey
ALTER TABLE "signal_favorites" ADD CONSTRAINT "signal_favorites_signal_id_fkey" FOREIGN KEY ("signal_id") REFERENCES "signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_favorites" ADD CONSTRAINT "signal_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_archives" ADD CONSTRAINT "signal_archives_signal_id_fkey" FOREIGN KEY ("signal_id") REFERENCES "signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_archives" ADD CONSTRAINT "signal_archives_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
