-- CreateEnum
CREATE TYPE "AuthAttemptType" AS ENUM ('LOGIN', 'SIGNUP');

-- AlterTable
ALTER TABLE "login_attempts"
  ADD COLUMN "type"   "AuthAttemptType" NOT NULL DEFAULT 'LOGIN',
  ADD COLUMN "reason" TEXT;

-- CreateIndex
CREATE INDEX "login_attempts_type_success_created_at_idx" ON "login_attempts"("type", "success", "created_at");
