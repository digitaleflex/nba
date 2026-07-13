-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('OK', 'BOUNCED', 'COMPLAINED', 'SUPPRESSED', 'INVALID');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_status" "EmailStatus" NOT NULL DEFAULT 'OK',
ADD COLUMN     "email_status_at" TIMESTAMP(3);

