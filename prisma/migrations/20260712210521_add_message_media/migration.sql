-- DropIndex
DROP INDEX "messages_read_at_idx";

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "attachment_mime" TEXT,
ADD COLUMN     "attachment_name" TEXT,
ADD COLUMN     "attachment_size" INTEGER,
ADD COLUMN     "attachment_url" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'TEXT';
